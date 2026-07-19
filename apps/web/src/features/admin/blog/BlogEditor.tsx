import { InputRule } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics'
import { TableKit } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, ReactNodeViewRenderer, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Code,
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
  Minus,
  Redo2,
  RemoveFormatting,
  Sigma,
  SquareCode,
  SquareFunction,
  Table as TableIcon,
  TextQuote,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import { useAdminAddBlogAsset, useAdminRemoveBlogAsset } from '@/api/queries/admin-blog'
import type { AdminBlogAsset } from '@/api/queries/admin-blog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MathNodeView } from './MathNodeView'

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

const extensions = [
  // StarterKit v3 already bundles link, underline, undo/redo, blockquote,
  // horizontal rule, code block, headings and both list types.
  StarterKit.configure({
    link: { openOnClick: false },
    heading: { levels: [1, 2, 3, 4] },
  }),
  InlineMathMarkdown,
  BlockMathMarkdown,
  Image,
  TableKit,
  Markdown,
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

  // Prompt for a URL, seeded with the current link if the caret sits in one.
  // An empty submission unlinks; cancelling leaves the document untouched.
  const toggleLink = () => {
    const current = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Link URL (leave empty to remove)', current ?? 'https://')
    if (href === null) return
    if (href === '') {
      chain().unsetLink().run()
      return
    }
    chain().extendMarkRange('link').setLink({ href }).run()
  }

  const insertMath = (block: boolean) => {
    const latex = window.prompt(
      block ? 'Display math (LaTeX)' : 'Inline math (LaTeX)',
      block ? '\\int_0^1 x^2 \\, dx = \\frac{1}{3}' : 'a^2 + b^2 = c^2',
    )
    if (!latex) return
    if (block) chain().insertBlockMath({ latex }).run()
    else chain().insertInlineMath({ latex }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-muted/40 px-2 py-1">
      <ToolButton
        icon={Bold}
        label="Bold (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolButton
        icon={Italic}
        label="Italic (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolButton
        icon={Code}
        label="Inline code"
        active={editor.isActive('code')}
        onClick={() => chain().toggleCode().run()}
      />
      <ToolButton
        icon={Link2}
        label="Add or remove link"
        active={editor.isActive('link')}
        onClick={toggleLink}
      />

      <Separator />

      {([1, 2, 3, 4] as const).map((level) => {
        const Icon = { 1: Heading1, 2: Heading2, 3: Heading3, 4: Heading4 }[level]
        return (
          <ToolButton
            key={level}
            icon={Icon}
            label={`Heading ${level}`}
            active={editor.isActive('heading', { level })}
            onClick={() => chain().toggleHeading({ level }).run()}
          />
        )
      })}
      <ToolButton
        icon={SquareCode}
        label="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => chain().toggleCodeBlock().run()}
      />

      <Separator />

      <ToolButton
        icon={List}
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolButton
        icon={ListOrdered}
        label="Ordered list"
        active={editor.isActive('orderedList')}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolButton
        icon={TextQuote}
        label="Block quote"
        active={editor.isActive('blockquote')}
        onClick={() => chain().toggleBlockquote().run()}
      />

      <Separator />

      <ToolButton
        icon={Undo2}
        label="Undo (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onClick={() => chain().undo().run()}
      />
      <ToolButton
        icon={Redo2}
        label="Redo (Ctrl+Shift+Z)"
        disabled={!editor.can().redo()}
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
        onClick={() =>
          chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
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
        class: cn(
          'prose prose-neutral max-w-none dark:prose-invert',
          'min-h-[24rem] rounded-b-lg border p-4 focus:outline-none',
          'prose-pre:bg-muted prose-pre:text-foreground',
          '[&_img]:rounded-lg',
        ),
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

  /** Insert an uploaded asset: images as image nodes, everything else as a link. */
  const insertAsset = (asset: AdminBlogAsset) => {
    if (!editor) return
    const url = asset.url ?? ''
    if (asset.kind === 'image') {
      editor.chain().focus().setImage({ src: url, alt: asset.filename }).run()
      return
    }
    editor
      .chain()
      .focus()
      .insertContent(`[${asset.filename}](${url})`, { contentType: 'markdown' })
      .run()
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_ASSET_BYTES) {
      toast.error('File must be 25 MB or smaller.')
      return
    }
    addAsset.mutate(file, {
      onSuccess: (asset) => {
        insertAsset(asset)
        toast.success('Uploaded and inserted.')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="space-y-3">
      <div>
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
        <div className="rounded-lg border">
          <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
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
    <span className={cn('flex size-8 items-center justify-center rounded bg-muted text-muted-foreground')}>
      <Icon className="size-4" />
    </span>
  )
}
