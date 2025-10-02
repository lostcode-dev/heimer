import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Command = {
  id: string
  label: string
  hint?: string
  action: () => void
}

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const commands = useMemo<Command[]>(
    () => [
      { id: 'go-dashboard', label: 'Ir para Painel', action: () => navigate('/') },
      { id: 'go-orders', label: 'Ir para Ordens', action: () => navigate('/orders') },
      { id: 'new-order', label: 'Nova Ordem', action: () => navigate('/orders/new') },
      { id: 'go-customers', label: 'Ir para Clientes', action: () => navigate('/customers') },
      { id: 'go-products', label: 'Ir para Produtos', action: () => navigate('/products') },
      { id: 'go-cash', label: 'Ir para Caixa', action: () => navigate('/cash') },
      { id: 'go-reports', label: 'Ir para Relatórios', action: () => navigate('/reports') },
      { id: 'go-settings', label: 'Ir para Configurações', action: () => navigate('/settings') },
    ],
    [navigate],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [query, commands])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="mx-auto max-w-lg rounded-[14px] border bg-white shadow-lg dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
        <div className="border-b p-3">
          <input
            autoFocus
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            placeholder="Digite para pesquisar comandos (Ex.: 'Nova Ordem')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Pesquisar comando"
          />
        </div>
        <ul className="max-h-72 overflow-auto p-2 text-sm">
          {filtered.length === 0 && <li className="px-2 py-1 text-slate-500">Nenhum comando encontrado.</li>}
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                className="w-full rounded-md px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => {
                  c.action()
                  setOpen(false)
                }}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t p-2 text-[11px] text-slate-500">Dica: use Ctrl+K (ou ⌘K no Mac) para abrir rapidamente.</div>
      </div>
    </div>
  )
}
