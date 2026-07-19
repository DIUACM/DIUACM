import 'katex/dist/katex.min.css'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { cn } from '@/lib/utils'

const attrs = defaultSchema.attributes ?? {}

// Blog authors are trusted admins (manage_blog), so we deliberately permit
// media embeds and inline styles. Sanitising still runs as defence-in-depth
// against a compromised account: no <script>, no event handlers. KaTeX (HTML
// output) needs className + style on its spans; media/iframe tags cover the
// image/video/file/embed features. `src`/`href` stay restricted to safe
// protocols by the inherited defaults.
const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'video',
    'audio',
    'source',
    'iframe',
  ],
  attributes: {
    ...attrs,
    '*': [...(attrs['*'] ?? []), 'className', 'style', 'ariaHidden'],
    a: [...(attrs.a ?? []), 'target', 'rel', 'download'],
    img: [...(attrs.img ?? []), 'width', 'height', 'loading', 'style'],
    video: ['src', 'controls', 'width', 'height', 'poster', 'preload', 'loop', 'muted', 'playsInline', 'style'],
    audio: ['src', 'controls', 'preload', 'loop'],
    source: ['src', 'type'],
    iframe: [
      'src',
      'width',
      'height',
      'title',
      'allow',
      'allowFullScreen',
      'frameBorder',
      'referrerPolicy',
      'loading',
      'style',
    ],
  },
}

const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [rehypeRaw, rehypeKatex, [rehypeSanitize, schema]] as never

/** Renders blog content: GitHub-flavoured Markdown + `$…$` LaTeX + safe HTML. */
export function MarkdownContent({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose prose-neutral max-w-none dark:prose-invert',
        'prose-headings:scroll-mt-20 prose-pre:bg-muted prose-pre:text-foreground',
        '[&_img]:rounded-lg [&_video]:w-full [&_video]:rounded-lg [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg',
        className,
      )}
    >
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {content}
      </Markdown>
    </div>
  )
}
