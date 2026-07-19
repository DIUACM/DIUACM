import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { LANGUAGE_OPTIONS } from '@/lib/highlight'

/**
 * Code block with a language picker.
 *
 * The chosen language is what ends up on the markdown fence (```cpp), so it
 * drives highlighting on the public page too, not just in the editor.
 */
export function CodeBlockView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'plaintext'

  return (
    <NodeViewWrapper className="relative">
      {editor.isEditable && (
        <select
          // `contentEditable={false}` keeps ProseMirror from treating the
          // select as part of the document's editable content.
          contentEditable={false}
          value={language}
          onChange={(event) => updateAttributes({ language: event.target.value })}
          className="absolute top-2 right-2 z-10 rounded border bg-background px-1 py-0.5 text-xs text-muted-foreground"
          aria-label="Code language"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {/* A fence may name a language the picker does not list; keep it
              selectable rather than silently switching to plain text. */}
          {!LANGUAGE_OPTIONS.some((option) => option.value === language) && (
            <option value={language}>{language}</option>
          )}
        </select>
      )}
      <pre>
        <NodeViewContent<'code'> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
