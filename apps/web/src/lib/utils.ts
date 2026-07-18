import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Some API descriptions contain raw HTML; render them as plain text. */
export function stripHtml(text: string): string {
  if (!text.includes('<')) return text
  const doc = new DOMParser().parseFromString(text, 'text/html')
  return doc.body.textContent?.trim() ?? ''
}
