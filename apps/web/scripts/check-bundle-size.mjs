import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const distDir = path.resolve(import.meta.dirname, '..', 'dist')
const manifestPath = path.join(distDir, '.vite', 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

const MAX_CHUNK_BYTES = 450 * 1024
const MAX_INITIAL_BYTES = 600 * 1024
const MAX_INITIAL_GZIP_BYTES = 180 * 1024
const measuredRoutes = [
  ['public blog post shell', 'src/features/blog/BlogPostPage.tsx', 50 * 1024],
  // The course page embeds YouTube through a plain iframe on purpose. This
  // budget is the tripwire for anyone reaching for a player SDK or pulling the
  // markdown renderer onto the route.
  ['public course page', 'src/features/courses/CourseDetailPage.tsx', 20 * 1024],
  ['public markdown renderer', 'src/components/shared/MarkdownContent.tsx', 280 * 1024],
  ['admin blog edit shell', 'src/features/admin/blog/AdminBlogPostDetailPage.tsx', 75 * 1024],
  ['admin rich-text editor', 'src/features/admin/blog/BlogEditor.tsx', 400 * 1024],
]

const manifestEntries = Object.entries(manifest)
const entries = manifestEntries.map(([, item]) => item)
const entry = manifestEntries.find(([, item]) => item.isEntry)
if (!entry) throw new Error('Vite manifest does not contain an entry chunk')

const byKey = new Map(manifestEntries)
const bytesFor = async (file) => (await stat(path.join(distDir, file))).size
const gzipBytesFor = async (file) => gzipSync(await readFile(path.join(distDir, file))).length

const collectStaticImports = (item, files = new Set()) => {
  if (!item || files.has(item.file)) return files
  files.add(item.file)
  for (const importedKey of item.imports ?? []) {
    collectStaticImports(byKey.get(importedKey), files)
  }
  return files
}
const initialFiles = collectStaticImports(entry[1])

const javascript = entries.filter((item) => item.file.endsWith('.js'))
const sizes = await Promise.all(
  javascript.map(async (item) => ({ file: item.file, bytes: await bytesFor(item.file) })),
)
sizes.sort((a, b) => b.bytes - a.bytes)

const oversized = sizes.filter((item) => item.bytes > MAX_CHUNK_BYTES)
const initialBytes = (
  await Promise.all([...initialFiles].filter((file) => file.endsWith('.js')).map(bytesFor))
).reduce((total, bytes) => total + bytes, 0)
const initialGzipBytes = (
  await Promise.all([...initialFiles].filter((file) => file.endsWith('.js')).map(gzipBytesFor))
).reduce((total, bytes) => total + bytes, 0)
const routeSizes = await Promise.all(
  measuredRoutes.map(async ([label, key, maxGzipBytes]) => {
    const item = byKey.get(key)
    if (!item) throw new Error(`Vite manifest does not contain ${key}`)
    const files = [...collectStaticImports(item)].filter(
      (file) => file.endsWith('.js') && !initialFiles.has(file),
    )
    const gzipBytes = (await Promise.all(files.map(gzipBytesFor))).reduce(
      (total, bytes) => total + bytes,
      0,
    )
    return { label, gzipBytes, maxGzipBytes }
  }),
)

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`
console.log(
  `Bundle budget: largest ${kib(sizes[0]?.bytes ?? 0)}, initial ${kib(initialBytes)} raw / ${kib(initialGzipBytes)} gzip, ${sizes.length} JS chunks`,
)
for (const route of routeSizes) {
  console.log(`Lazy route: ${route.label} +${kib(route.gzipBytes)} gzip`)
}

if (oversized.length > 0) {
  throw new Error(
    `JavaScript chunk budget exceeded (${kib(MAX_CHUNK_BYTES)}): ${oversized
      .map((item) => `${item.file}=${kib(item.bytes)}`)
      .join(', ')}`,
  )
}

if (initialBytes > MAX_INITIAL_BYTES) {
  throw new Error(
    `Initial JavaScript budget exceeded: ${kib(initialBytes)} > ${kib(MAX_INITIAL_BYTES)}`,
  )
}

if (initialGzipBytes > MAX_INITIAL_GZIP_BYTES) {
  throw new Error(
    `Initial gzip JavaScript budget exceeded: ${kib(initialGzipBytes)} > ${kib(MAX_INITIAL_GZIP_BYTES)}`,
  )
}

const oversizedRoutes = routeSizes.filter((route) => route.gzipBytes > route.maxGzipBytes)
if (oversizedRoutes.length > 0) {
  throw new Error(
    `Lazy-route gzip budget exceeded: ${oversizedRoutes
      .map((route) => `${route.label}=${kib(route.gzipBytes)} > ${kib(route.maxGzipBytes)}`)
      .join(', ')}`,
  )
}
