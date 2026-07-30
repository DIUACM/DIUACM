import { Code2 } from 'lucide-react'
import { Link } from 'react-router'

const FOOTER_LINKS = [
  { to: '/events', label: 'Events' },
  { to: '/trackers', label: 'Trackers' },
  { to: '/programmers', label: 'Programmers' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/blog', label: 'Blog' },
]

export function Footer() {
  return (
    <footer className="pt-8 pb-6">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-card/70 px-6 py-7 text-sm text-muted-foreground shadow-clay ring-1 ring-foreground/5 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-clay-sm">
              <Code2 className="size-4.5" />
            </span>
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} DIU ACM — Daffodil International
              University
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
