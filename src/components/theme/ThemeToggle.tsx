import { Button } from '../ui/button'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button variant="secondary" onClick={toggle} title="Alternar tema claro/escuro" aria-label="Alternar tema claro/escuro">
      {theme === 'dark' ? 'Tema: Escuro' : 'Tema: Claro'}
    </Button>
  )
}
