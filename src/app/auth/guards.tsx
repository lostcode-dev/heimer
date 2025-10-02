import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabaseClient'

export function AuthGuard() {
  const { loading, session, signOut } = useAuth()
  const [checkingCompany, setCheckingCompany] = useState(false)
  const [hasCompany, setHasCompany] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    async function checkCompany() {
      if (!session) return
      setCheckingCompany(true)
      try {
        const { data } = await supabase.rpc('current_company_id')
        if (!mounted) return
        setHasCompany(Boolean(data))
        if (!data) {
          // No company linked: sign out and let redirect below handle
          await signOut()
        }
      } finally {
        if (mounted) setCheckingCompany(false)
      }
    }
    if (session) void checkCompany()
    return () => { mounted = false }
  }, [session])

  if (loading || (session && (checkingCompany || hasCompany === null))) return <p>Carregando…</p>
  if (!session) return <Navigate to="/auth/signin" replace />
  if (hasCompany === false) return <Navigate to="/auth/signin?error=no-company" replace />
  return <Outlet />
}
