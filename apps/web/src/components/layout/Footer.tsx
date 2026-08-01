import { Send } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

const FOOTER_LINKS = [
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border/70 bg-card">
      <div className="container">
        <div className="grid gap-7 py-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-center sm:py-10">
          <div className="flex items-start gap-4">
            <Link
              to="/"
              aria-label="DIU ACM home"
              className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-clay-sm ring-1 ring-black/5 transition-shadow hover:shadow-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-foreground/5 dark:ring-white/10"
            >
              <img
                src="/brands/diu-acm-logo.png"
                alt=""
                className="size-full object-cover dark:brightness-125"
                loading="lazy"
              />
            </Link>

            <div>
              <Link
                to="/"
                className="font-heading text-base font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                DIU ACM Programming Lab
              </Link>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                A competitive programming community of the Department of CSE,
                Daffodil International University.
              </p>
            </div>
          </div>

          <Button size="lg" className="w-full sm:w-fit md:justify-self-end" asChild>
            <a
              href="https://t.me/+AH0gg2-V5xIxYjA9"
              target="_blank"
              rel="noreferrer"
            >
              Join Telegram <Send />
            </a>
          </Button>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/70 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} DIU ACM. All rights reserved.
          </p>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-1 gap-y-1"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full px-2.5 py-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
