import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

export function AuthGuard() {
  const { loading, session, signOut } = useAuth()
  const [checkingCompany, setCheckingCompany] = useState(false)
  const [hasCompany, setHasCompany] = useState<boolean | null>(null)
  const checkedOnce = useRef<boolean>(false)

  useEffect(() => {
    let mounted = true
    async function checkCompany() {
      if (!session) return
      // Skip re-checks if already determined once for this session
      if (checkedOnce.current && hasCompany !== null) return
      setCheckingCompany(true)
      try {
        const { data } = await supabase.rpc('current_company_id')
        if (!mounted) return
        const ok = Boolean(data)
        setHasCompany(ok)
        checkedOnce.current = true
        if (!ok) {
          await signOut()
        }
      } finally {
        if (mounted) setCheckingCompany(false)
      }
    }
    if (session) void checkCompany()
    return () => { mounted = false }
  }, [session])

  // Avoid flashing loading after initial check; if we already determined hasCompany, render directly
  if (loading || (session && !checkedOnce.current && (checkingCompany || hasCompany === null))) {
    return (
      <div className="min-h-screen w-full grid place-items-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-20 w-20 animate-spin" />
        </div>
      </div>
    )
  }
  if (!session) return <Navigate to="/auth/signin" replace />
  if (hasCompany === false) return <Navigate to="/auth/signin?error=no-company" replace />
  return <Outlet />
}
