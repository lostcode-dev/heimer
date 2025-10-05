import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build normalized internal links (avoid double slashes and ensure leading slash)
export function normalizeLink(path: string) {
  if (!path) return '/'
  let p = path.trim()
  if (!p.startsWith('/')) p = '/' + p
  // collapse multiple slashes
  p = p.replace(/\/+/, '/').replace(/\/+$/, '')
  return p || '/'
}

// Normalize text (trim, collapse whitespace/newlines) and truncate to max length with ellipsis
export function normalizeAndTruncate(input: unknown, max = 20): string {
  if (input == null) return ''
  const str = String(input)
    .replace(/\s+/g, ' ') // collapse all whitespace (including newlines/tabs)
    .trim()
  if (str.length <= max) return str
  return str.slice(0, Math.max(0, max)).trimEnd() + '...'
}
