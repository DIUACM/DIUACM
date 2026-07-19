import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import markdown from 'highlight.js/lib/languages/markdown'
// Registered so `plaintext` is a real no-op language. Without it lowlight
// falls back to auto-detection and colours blocks the author left unlabelled,
// which the public renderer (no detection) would not.
import plaintext from 'highlight.js/lib/languages/plaintext'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { createLowlight, type LanguageFn } from 'lowlight'

/**
 * Languages we highlight, shared by the editor (via CodeBlockLowlight) and the
 * public renderer (via rehype-highlight) so a post looks the same in both.
 *
 * Deliberately a curated list rather than highlight.js's `common` bundle: this
 * is a competitive-programming site, so C++/Python/Java carry almost all of it,
 * and the full set costs bundle size for languages nobody here posts. Each
 * language brings its own aliases, so ```c++ and ```py resolve on their own.
 * Anything unregistered still renders — just without colours.
 */
export const highlightLanguages: Record<string, LanguageFn> = {
  bash,
  c,
  cpp,
  csharp,
  css,
  go,
  java,
  javascript,
  json,
  kotlin,
  markdown,
  plaintext,
  python,
  rust,
  sql,
  typescript,
  xml,
}

/** Languages offered in the editor's code-block picker, in menu order. */
export const LANGUAGE_OPTIONS = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'HTML / XML' },
  { value: 'css', label: 'CSS' },
  { value: 'markdown', label: 'Markdown' },
] as const

export const lowlight = createLowlight(highlightLanguages)
