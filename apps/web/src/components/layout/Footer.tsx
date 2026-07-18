import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} DIU ACM — Daffodil International
          University
        </p>
        <nav className="flex items-center gap-4">
          <Link to="/events" className="hover:text-foreground">
            Events
          </Link>
          <Link to="/trackers" className="hover:text-foreground">
            Trackers
          </Link>
          <Link to="/programmers" className="hover:text-foreground">
            Programmers
          </Link>
        </nav>
      </div>
    </footer>
  )
}
