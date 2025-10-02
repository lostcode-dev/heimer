import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Toast = {
  id: number
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  duration?: number
}

type ToastContextValue = {
  notify: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const notify = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    const toast: Toast = { id, duration: 3000, variant: 'default', ...t }
    setToasts((prev) => [...prev, toast])
    const ms = toast.duration ?? 3000
    if (ms > 0) setTimeout(() => dismiss(id), ms)
  }, [])
  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])
  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={
                'pointer-events-auto w-full max-w-sm rounded-[14px] border bg-white p-3 shadow-lg dark:bg-slate-900' +
                ' ' +
                (t.variant === 'success' ? 'border-emerald-300' : t.variant === 'error' ? 'border-rose-300' : '')
              }
              role="status"
              aria-live="polite"
            >
              {t.title && <div className="text-sm font-medium">{t.title}</div>}
              {t.description && <div className="text-xs text-slate-600 dark:text-slate-300">{t.description}</div>}
              <div className="mt-2 flex justify-end">
                <button className="rounded-md border px-2 py-1 text-xs" onClick={() => dismiss(t.id)} aria-label="Fechar alerta">
                  Fechar
                </button>
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
