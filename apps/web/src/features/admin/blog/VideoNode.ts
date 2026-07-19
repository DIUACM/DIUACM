import { Node } from '@tiptap/core'
import type { JSONContent, MarkdownToken } from '@tiptap/core'

const VIDEO_TAG = /^<video\b[^>]*>(?:\s*<\/video>)?/

/**
 * Block-level video player for uploaded assets. Stored in the markdown body as
 * a literal `<video>` tag, which the public renderer (rehype-raw + the
 * sanitize schema) already turns into a player.
 *
 * marked does not list `video` among its block-level HTML tags, so without the
 * custom tokenizer below the tag would lex as *inline* HTML and the node would
 * end up nested inside a paragraph, which the schema forbids. The tokenizer
 * claims a leading `<video …>` at block level and hands it to `parseMarkdown`.
 */
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'video[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', { ...HTMLAttributes, controls: 'true', preload: 'metadata' }]
  },

  markdownTokenizer: {
    name: 'video',
    level: 'block',
    start: (src: string) => src.indexOf('<video'),
    tokenize(src: string) {
      const match = VIDEO_TAG.exec(src)
      if (!match) return undefined
      const srcAttr = /src\s*=\s*"([^"]*)"/.exec(match[0])
      return {
        type: 'video',
        raw: match[0],
        src: srcAttr ? srcAttr[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : null,
      }
    },
  },

  parseMarkdown(token: MarkdownToken, helpers) {
    return helpers.createNode('video', { src: token.src as string | null })
  },

  renderMarkdown(node: JSONContent) {
    const src = String(node.attrs?.src ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
    return `<video src="${src}" controls></video>`
  },
})
