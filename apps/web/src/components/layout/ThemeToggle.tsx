import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() =>
        setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
      }
    >
      <Sun className="size-4.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
