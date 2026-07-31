import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import katex from 'katex'
// KaTeX's stylesheet ships with whichever chunk renders maths, rather than
// eagerly from index.css — this view and MarkdownContent are its only two
// consumers and both are code-split.
import 'katex/dist/katex.min.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Render LaTeX, falling back to the KaTeX error message when it won't parse. */
function useRendered(latex: string, displayMode: boolean) {
  return useMemo(() => {
    if (latex.trim() === '') return { html: null, error: 'Empty' }
    try {
      return {
        html: katex.renderToString(latex, { displayMode, throwOnError: true }),
        error: null as string | null,
      }
    } catch (cause) {
      return { html: null, error: cause instanceof Error ? cause.message : 'Invalid LaTeX' }
    }
  }, [latex, displayMode])
}

/**
 * Click-to-edit maths. A rendered node shows KaTeX; clicking swaps in a plain
 * text field holding the LaTeX source, so editing happens inline rather than
 * through a dialog. Enter (or blur) commits, Escape reverts, and leaving the
 * field empty removes the node.
 */
export function MathNodeView({ node, updateAttributes, editor, deleteNode }: ReactNodeViewProps) {
  const displayMode = node.type.name === 'blockMath'
  const latex = (node.attrs.latex as string) ?? ''
  const [editing, setEditing] = useState(false)
  // The value being typed. Committed to the node on every keystroke so the
  // markdown stays in sync, with `initial` kept aside so Escape can undo.
  const [draft, setDraft] = useState(latex)
  const initial = useRef(latex)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const { html, error } = useRendered(latex, displayMode)

  useEffect(() => {
    if (!editing) return
    const field = fieldRef.current
    if (!field) return
    field.focus()
    field.select()
  }, [editing])

  const startEditing = () => {
    if (!editor.isEditable) return
    initial.current = latex
    setDraft(latex)
    setEditing(true)
  }

  const commit = () => {
    setEditing(false)
    if (draft.trim() === '') deleteNode()
    else editor.commands.focus()
  }

  const cancel = () => {
    updateAttributes({ latex: initial.current })
    setEditing(false)
    editor.commands.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    // Keep ProseMirror's keymap out of the field — otherwise Enter splits the
    // surrounding paragraph and Backspace can delete the node mid-edit.
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
      return
    }
    // Display maths may span lines, so only inline maths commits on Enter.
    if (event.key === 'Enter' && (!displayMode || event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      commit()
    }
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft(event.target.value)
    updateAttributes({ latex: event.target.value })
  }

  const fieldClass = cn(
    'rounded-lg bg-card px-1.5 font-mono text-sm text-foreground shadow-clay-sm ring-1 ring-primary/40',
    'focus:outline-none focus:ring-1 focus:ring-primary',
  )

  if (editing) {
    return (
      <NodeViewWrapper as={displayMode ? 'div' : 'span'} className={displayMode ? 'my-3' : ''}>
        <span contentEditable={false}>
          {displayMode ? (
            <textarea
              ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
              className={cn(fieldClass, 'block w-full resize-y')}
              rows={Math.max(2, draft.split('\n').length)}
              value={draft}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onBlur={commit}
            />
          ) : (
            <input
              ref={fieldRef as React.RefObject<HTMLInputElement>}
              className={fieldClass}
              // Grow with the content so the field doesn't clip long expressions.
              style={{ width: `${Math.max(draft.length + 1, 4)}ch` }}
              value={draft}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onBlur={commit}
            />
          )}
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as={displayMode ? 'div' : 'span'}
      className={cn(displayMode && 'my-3 text-center')}
    >
      <span
        contentEditable={false}
        role="button"
        tabIndex={0}
        title="Click to edit LaTeX"
        className={cn(
          'cursor-pointer rounded-md px-0.5 hover:bg-primary/10',
          error && 'text-destructive underline decoration-wavy',
        )}
        // Must be mousedown, not click: ProseMirror turns a mousedown on an
        // atom node into a NodeSelection and pulls focus back to the editor,
        // which would blur the field the moment it mounted. Preventing the
        // default keeps focus free for the input to claim.
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          startEditing()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            startEditing()
          }
        }}
        {...(html ? { dangerouslySetInnerHTML: { __html: html } } : {})}
      >
        {html ? undefined : (error ?? 'Invalid LaTeX')}
      </span>
    </NodeViewWrapper>
  )
}
