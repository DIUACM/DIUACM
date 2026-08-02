import { Extension, InputRule } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import {
  EditorContent,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
  type Editor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  Code,
  Columns3,
  FileUp,
  Film,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Merge,
  Minus,
  Redo2,
  RemoveFormatting,
  Rows3,
  Sigma,
  Split,
  SquareCode,
  SquareFunction,
  Table as TableIcon,
  TextQuote,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import { useAdminAddBlogAsset, useAdminRemoveBlogAsset } from '@/api/queries/admin-blog'
import type { AdminBlogAsset } from '@/api/queries/admin-blog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { lowlight } from '@/lib/highlight'
import { cn } from '@/lib/utils'
import { CodeBlockView } from './CodeBlockView'
import { MathNodeView } from './MathNodeView'
import { Video } from './VideoNode'

const MAX_ASSET_BYTES = 25 * 1024 * 1024

// The stock math extension binds its input rules to `$$x$$` for inline and
// `$$$x$$$` for display maths. Our content is stored as ordinary markdown, and
// the serialiser already emits `$…$` / `$$…$$`, so retarget the rules at those
// delimiters — otherwise typing `$n$` produces nothing. Handlers mirror the
// upstream ones.
const InlineMathMarkdown = InlineMath.extend({
  addInputRules() {
    return [
      new InputRule({
        // A single `$…$` run, not touching another `$` on either side, so that
        // typing out a `$$…$$` block never trips the inline rule first. The
        // content may not begin or end with whitespace, which is what keeps
        // prose like "costs $5 and $10" from collapsing into a math node.
        find: /(?<!\$)\$([^$\s\n][^$\n]*?[^$\s\n]|[^$\s\n])\$(?!\$)/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex: match[1] }))
        },
      }),
    ]
  },
  // Inline nodes must sit in an inline wrapper or the surrounding line breaks.
  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView, { as: 'span' })
  },
})

const BlockMathMarkdown = BlockMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const { tr } = state
          const $from = state.doc.resolve(range.from)
          const node = this.type.create({ latex: match[1] })
          // When the rule swallows a whole paragraph, replace that paragraph
          // rather than leaving an empty one wrapped around the math node.
          const consumesHostTextblock =
            $from.depth > 0 &&
            $from.parent.isTextblock &&
            range.from === $from.start() &&
            range.to === $from.end()
          const canReplaceHostTextblock =
            consumesHostTextblock &&
            $from.node(-1).canReplaceWith($from.index(-1), $from.indexAfter(-1), this.type)
          const replacement = canReplaceHostTextblock
            ? { from: $from.before(), to: $from.after() }
            : range
          tr.replaceWith(replacement.from, replacement.to, node)
        },
      }),
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },
})

/**
 * Enforces exactly one header row — the first — on every table.
 *
 * GFM tables are always "one header row, then body rows", with no syntax for a
 * headerless table or a second header. Left alone, the editor happily produces
 * both: deleting the header row serialises an invented blank header, and
 * inserting a row above the header leaves two rows styled as headers while the
 * markdown calls the second one a body row. Either way the document says
 * something the stored markdown cannot, so normalise after every change and
 * keep what you see identical to what gets saved.
 */
const AlwaysTableHeader = Extension.create({
  name: 'alwaysTableHeader',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('alwaysTableHeader'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) return null
          const { tableHeader, tableCell, table } = newState.schema.nodes
          if (!tableHeader || !tableCell || !table) return null

          const tr = newState.tr
          let changed = false
          newState.doc.descendants((node, pos) => {
            if (node.type !== table) return
            // Table content starts at pos + 1; each row's cells at rowPos + 1.
            let rowPos = pos + 1
            node.forEach((row, _offset, index) => {
              const wanted = index === 0 ? tableHeader : tableCell
              let cellPos = rowPos + 1
              row.forEach((cell) => {
                if (cell.type !== wanted) {
                  // Retyping a cell leaves its size unchanged, so positions
                  // gathered from `newState.doc` stay valid across the loop.
                  tr.setNodeMarkup(cellPos, wanted, cell.attrs, cell.marks)
                  changed = true
                }
                cellPos += cell.nodeSize
              })
              rowPos += row.nodeSize
            })
          })
          return changed ? tr : null
        },
      }),
    ]
  },
})

const extensions = [
  // StarterKit v3 already bundles link, underline, undo/redo, blockquote,
  // horizontal rule, code block, headings and both list types.
  StarterKit.configure({
    link: { openOnClick: false },
    heading: { levels: [1, 2, 3, 4] },
    // Replaced below by the highlighting variant, which shares its node name.
    codeBlock: false,
  }),
  CodeBlockLowlight.extend({
    // Adds the language picker; the block's code still renders through lowlight.
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlockView)
    },
  }).configure({ lowlight, defaultLanguage: 'plaintext' }),
  InlineMathMarkdown,
  BlockMathMarkdown,
  Image,
  Video,
  TableKit,
  AlwaysTableHeader,
  Markdown,
  Placeholder.configure({
    placeholder: 'Write your post… markdown shortcuts work, and $x$ becomes maths.',
  }),
]

/** Toolbar button: an icon that runs a command and reflects the active mark. */
function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: typeof Bold
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-8', active && 'bg-accent text-accent-foreground')}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-4" />
    </Button>
  )
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-border" />
}

/**
 * What the toolbar shows when there is no live editor to read. Frozen and
 * shared so `useEditorState`'s equality check treats repeats as unchanged.
 */
const IDLE_TOOLBAR_STATE = Object.freeze({
  bold: false,
  italic: false,
  code: false,
  link: false,
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  codeBlock: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  canUndo: false,
  canRedo: false,
  inTable: false,
  canMergeCells: false,
  canSplitCell: false,
})

function Toolbar({
  editor,
  onUpload,
  uploading,
}: {
  editor: Editor
  onUpload: () => void
  uploading: boolean
}) {
  const chain = () => editor.chain().focus()
  const [linkOpen, setLinkOpen] = useState(false)
  const [href, setHref] = useState('')

  // `useEditor` does not re-render on transactions in Tiptap 3, so reading
  // `editor.isActive(…)` during render would freeze every button on whatever
  // the state was at mount. This subscribes to just the flags the toolbar draws.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      // The selector can run against an editor Tiptap has already torn down:
      // `useEditor` destroys the outgoing instance on a timer (see
      // `scheduleDestroy`), which StrictMode's mount/unmount/remount triggers
      // on every dev page load. `destroy()` nulls out `commandManager`,
      // `extensionManager` and `schema`, and neither `can()` nor `isActive()`
      // guards against that — so reading either would throw before the
      // replacement editor arrives. An inert toolbar for one render is the
      // right answer; the next transaction fills it in.
      if (!editor || editor.isDestroyed) return IDLE_TOOLBAR_STATE
      return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        code: editor.isActive('code'),
        link: editor.isActive('link'),
        h1: editor.isActive('heading', { level: 1 }),
        h2: editor.isActive('heading', { level: 2 }),
        h3: editor.isActive('heading', { level: 3 }),
        h4: editor.isActive('heading', { level: 4 }),
        codeBlock: editor.isActive('codeBlock'),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        blockquote: editor.isActive('blockquote'),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        inTable: editor.isActive('table'),
        canMergeCells: editor.can().mergeCells(),
        canSplitCell: editor.can().splitCell(),
      }
    },
  })
  const headingActive = { 1: state.h1, 2: state.h2, 3: state.h3, 4: state.h4 }

  const openLinkDialog = () => {
    setHref((editor.getAttributes('link').href as string | undefined) ?? 'https://')
    setLinkOpen(true)
  }

  const applyLink = (event: React.FormEvent) => {
    event.preventDefault()
    setLinkOpen(false)
    // An empty URL means "unlink", matching the button's dual purpose.
    if (href.trim() === '') chain().extendMarkRange('link').unsetLink().run()
    else chain().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  // Maths is edited in place by clicking the rendered node, so the toolbar just
  // drops in a starter expression rather than asking for LaTeX up front.
  const insertMath = (block: boolean) => {
    if (block) chain().insertBlockMath({ latex: 'x^2 + y^2 = z^2' }).run()
    else chain().insertInlineMath({ latex: 'x' }).run()
  }

  // Shown only while the caret sits inside a table. There is deliberately no
  // "toggle header row" control: `AlwaysTableHeader` would undo it immediately.
  const tableControls = state.inTable && (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-accent/40 px-2 py-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">Table</span>
      <ToolButton
        icon={BetweenHorizontalStart}
        label="Insert row above"
        onClick={() => chain().addRowBefore().run()}
      />
      <ToolButton
        icon={BetweenHorizontalEnd}
        label="Insert row below"
        onClick={() => chain().addRowAfter().run()}
      />
      <ToolButton icon={Rows3} label="Delete row" onClick={() => chain().deleteRow().run()} />
      <Separator />
      <ToolButton
        icon={BetweenVerticalStart}
        label="Insert column left"
        onClick={() => chain().addColumnBefore().run()}
      />
      <ToolButton
        icon={BetweenVerticalEnd}
        label="Insert column right"
        onClick={() => chain().addColumnAfter().run()}
      />
      <ToolButton
        icon={Columns3}
        label="Delete column"
        onClick={() => chain().deleteColumn().run()}
      />
      <Separator />
      <ToolButton
        icon={Merge}
        label="Merge cells"
        disabled={!state.canMergeCells}
        onClick={() => chain().mergeCells().run()}
      />
      <ToolButton
        icon={Split}
        label="Split cell"
        disabled={!state.canSplitCell}
        onClick={() => chain().splitCell().run()}
      />
      <Separator />
      <ToolButton
        icon={Trash2}
        label="Delete table"
        onClick={() => chain().deleteTable().run()}
      />
    </div>
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/60 px-2 py-1.5">
        <ToolButton
          icon={Bold}
          label="Bold (Ctrl+B)"
          active={state.bold}
          onClick={() => chain().toggleBold().run()}
        />
        <ToolButton
          icon={Italic}
          label="Italic (Ctrl+I)"
          active={state.italic}
          onClick={() => chain().toggleItalic().run()}
        />
        <ToolButton
          icon={Code}
          label="Inline code"
          active={state.code}
          onClick={() => chain().toggleCode().run()}
        />
        <ToolButton
          icon={Link2}
          label="Add or remove link"
          active={state.link}
          onClick={openLinkDialog}
        />

        <Separator />

        {([1, 2, 3, 4] as const).map((level) => {
          const Icon = { 1: Heading1, 2: Heading2, 3: Heading3, 4: Heading4 }[level]
          return (
            <ToolButton
              key={level}
              icon={Icon}
              label={`Heading ${level}`}
              active={headingActive[level]}
              onClick={() => chain().toggleHeading({ level }).run()}
            />
          )
        })}
        <ToolButton
          icon={SquareCode}
          label="Code block"
          active={state.codeBlock}
          onClick={() => chain().toggleCodeBlock().run()}
        />

        <Separator />

        <ToolButton
          icon={List}
          label="Bullet list"
          active={state.bulletList}
          onClick={() => chain().toggleBulletList().run()}
        />
        <ToolButton
          icon={ListOrdered}
          label="Ordered list"
          active={state.orderedList}
          onClick={() => chain().toggleOrderedList().run()}
        />
        <ToolButton
          icon={TextQuote}
          label="Block quote"
          active={state.blockquote}
          onClick={() => chain().toggleBlockquote().run()}
        />

        <Separator />

        <ToolButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          disabled={!state.canUndo}
          onClick={() => chain().undo().run()}
        />
        <ToolButton
          icon={Redo2}
          label="Redo (Ctrl+Shift+Z)"
          disabled={!state.canRedo}
          onClick={() => chain().redo().run()}
        />

        <Separator />

        <ToolButton
          icon={ImagePlus}
          label="Upload image, video, or file"
          disabled={uploading}
          onClick={onUpload}
        />
        <ToolButton icon={Sigma} label="Inline math" onClick={() => insertMath(false)} />
        <ToolButton icon={SquareFunction} label="Math block" onClick={() => insertMath(true)} />
        <ToolButton
          icon={TableIcon}
          label="Insert table"
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />
        <ToolButton
          icon={Minus}
          label="Horizontal rule"
          onClick={() => chain().setHorizontalRule().run()}
        />

        <Separator />

        <ToolButton
          icon={RemoveFormatting}
          label="Clear formatting"
          onClick={() => chain().unsetAllMarks().clearNodes().run()}
        />
      </div>

      {tableControls}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={applyLink}>
            <DialogHeader>
              <DialogTitle>Link</DialogTitle>
              <DialogDescription>
                Enter a URL, or clear the field to remove the link.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={href}
              onChange={(event) => setHref(event.target.value)}
              placeholder="https://example.com"
              className="my-4"
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Apply</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function BlogEditor({
  postId,
  value,
  onChange,
  assets,
}: {
  postId: number
  value: string
  onChange: (value: string) => void
  assets: AdminBlogAsset[]
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addAsset = useAdminAddBlogAsset(postId)
  const removeAsset = useAdminRemoveBlogAsset(postId)
  // Markdown we last handed to `onChange`. Lets the sync effect below tell an
  // echo of our own edit apart from a genuine external change to `value`.
  const lastEmitted = useRef(value)
  // `editorProps` is captured when the editor is built, so the paste/drop
  // handlers below reach the current upload function through a ref rather than
  // closing over a stale one.
  const uploadRef = useRef<(file: File, pos?: number) => void>(() => {})

  const editor = useEditor({
    extensions,
    content: value,
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown()
      lastEmitted.current = markdown
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        // ProseMirror's contenteditable isn't a labelable element, so the
        // visible "Body" caption can't reach it with `htmlFor` — without this
        // the editor is announced as an unnamed text box.
        'aria-label': 'Post body',
        class: cn(
          'prose prose-neutral max-w-none dark:prose-invert',
          // The surrounding panel supplies the border and radius.
          'min-h-[24rem] p-5 focus:outline-none',
          // Kept in step with MarkdownContent so what you type matches what
          // the published post renders as — including no literal backticks
          // around inline code.
          'prose-pre:rounded-2xl prose-pre:bg-muted prose-pre:text-foreground prose-pre:shadow-clay-inset',
          'prose-code:before:content-none prose-code:after:content-none',
          '[&_img]:rounded-2xl [&_video]:rounded-2xl [&_iframe]:rounded-2xl',
        ),
      },
      // Paste a screenshot straight in. Only claims the event when the
      // clipboard actually carries files, so pasting text is untouched.
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (files.length === 0) return false
        event.preventDefault()
        for (const file of files) uploadRef.current(file)
        return true
      },
      // Drop files anywhere in the document; `moved` means the user dragged an
      // existing node around, which ProseMirror should keep handling itself.
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files ?? [])
        if (files.length === 0) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        for (const file of files) uploadRef.current(file, pos)
        return true
      },
    },
  })

  // Re-seed the document when `value` changes from outside (e.g. the post
  // finishes loading). Skipping our own echo avoids clobbering the caret.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return
    lastEmitted.current = value
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false })
  }, [editor, value])

  /**
   * Insert an uploaded asset: images as image nodes, videos as players, and
   * everything else as a link. `pos` targets a drop location; without it the
   * insert lands at the caret.
   */
  const insertAsset = (asset: AdminBlogAsset, pos?: number) => {
    if (!editor) return
    const url = asset.url ?? ''
    const chain = editor.chain().focus(pos)
    if (asset.kind === 'image') {
      chain.setImage({ src: url, alt: asset.filename }).run()
      return
    }
    if (asset.kind === 'video') {
      chain.insertContent({ type: 'video', attrs: { src: url } }).run()
      return
    }
    chain.insertContent(`[${asset.filename}](${url})`, { contentType: 'markdown' }).run()
  }

  /** Upload one file and drop the result into the document. */
  const uploadFile = (file: File, pos?: number) => {
    if (file.size > MAX_ASSET_BYTES) {
      toast.error(`${file.name} is larger than 25 MB.`)
      return
    }
    addAsset.mutate(file, {
      onSuccess: (asset) => {
        insertAsset(asset, pos)
        toast.success('Uploaded and inserted.')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }
  uploadRef.current = uploadFile

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-3">
      {/* One clay panel holding the toolbar band and the writing surface. */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-clay ring-1 ring-foreground/5">
        {editor && (
          <Toolbar
            editor={editor}
            uploading={addAsset.isPending}
            onUpload={() => fileInputRef.current?.click()}
          />
        )}
        <EditorContent editor={editor} />
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />

      {assets.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-card shadow-clay-sm ring-1 ring-foreground/5">
          <div className="border-b bg-muted/60 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">
            Uploaded media ({assets.length})
          </div>
          <ul className="divide-y">
            {assets.map((asset) => (
              <li key={asset.id} className="flex items-center gap-3 px-3 py-2">
                <AssetIcon kind={asset.kind} />
                <span className="min-w-0 flex-1 truncate text-sm">{asset.filename}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertAsset(asset)}
                >
                  Insert
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${asset.filename}`}
                  onClick={() =>
                    removeAsset.mutate(asset.id, {
                      onSuccess: () => toast.success('Media removed.'),
                      onError: (error) => toast.error(errorMessage(error)),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function AssetIcon({ kind }: { kind: AdminBlogAsset['kind'] }) {
  const Icon = kind === 'image' ? ImageIcon : kind === 'video' ? Film : FileUp
  return (
    <span className={cn('flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground shadow-clay-inset')}>
      <Icon className="size-4" />
    </span>
  )
}
