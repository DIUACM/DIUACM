import 'katex/dist/katex.min.css'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { highlightLanguages } from '@/lib/highlight'
import { cn } from '@/lib/utils'
import { ResponsiveImage } from './ResponsiveImage'

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
    // KaTeX draws radicals and stretchy delimiters with inline SVG paths;
    // stripping these silently loses the √ sign and friends.
    'svg',
    'path',
    'line',
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
    svg: ['xmlns', 'width', 'height', 'viewBox', 'preserveAspectRatio', 'style'],
    path: ['d'],
    line: ['x1', 'y1', 'x2', 'y2', 'strokeWidth'],
  },
}

const remarkPlugins = [remarkGfm, remarkMath]
// Sanitising stays last so it vets whatever the earlier plugins produced. The
// highlighter only adds `hljs-*` classes to spans, which the schema permits.
const rehypePlugins = [
  rehypeRaw,
  rehypeKatex,
  [rehypeHighlight, { languages: highlightLanguages }],
  [rehypeSanitize, schema],
] as never

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
        'prose-headings:scroll-mt-24 prose-pre:rounded-2xl prose-pre:bg-muted prose-pre:text-foreground prose-pre:shadow-clay-inset',
        // Tailwind Typography wraps inline code in literal backticks by default.
        'prose-code:before:content-none prose-code:after:content-none',
        '[&_img]:rounded-2xl [&_video]:w-full [&_video]:rounded-2xl [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-2xl',
        className,
      )}
    >
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          img: ({ src, alt, ...props }) =>
            typeof src === 'string' ? (
              <ResponsiveImage
                {...props}
                src={src}
                preset="content"
                alt={alt ?? ''}
              />
            ) : null,
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
