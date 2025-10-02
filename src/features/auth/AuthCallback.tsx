import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { apiCompanies } from '@/lib/api'
import { useAuth } from '@/app/auth/AuthProvider'
import { toast } from 'sonner'

export default function AuthCallback() {
  const { signOut } = useAuth()
  useEffect(() => {
    // Supabase trata o fragmento/hash automaticamente via detectSessionInUrl
    // Após capturar a sessão, redirecionamos para o app
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        try {
          // Try to bootstrap tenant (idempotent): create company and link user
          const companyName = (data.session.user.user_metadata as any)?.company_name || null
          const res = await supabase.functions.invoke('bootstrap-tenant', { body: { company_name: companyName } })
          if (res.error) {
            console.warn('bootstrap-tenant error', res.error)
            // Fallback: try client-side company creation/link
            try {
              await apiCompanies.upsertMyCompany({ name: companyName || 'Minha Empresa' })
              toast.message('Empresa criada', { description: 'Sua empresa foi associada à sua conta.' })
            } catch (fErr) {
              toast.message('Finalizando configuração', { description: 'Não foi possível criar/associar a empresa automaticamente.' })
            }
          }
        } catch (e) {
          console.warn('bootstrap-tenant invoke failed', e)
          // Fallback path if functions are not deployed locally
          try {
            const companyName = (data.session.user.user_metadata as any)?.company_name || null
            await apiCompanies.upsertMyCompany({ name: companyName || 'Minha Empresa' })
          } catch {
            // ignore
          }
        }
        // After attempts, ensure company exists. If not, sign out and redirect.
        try {
          const company = await apiCompanies.getMyCompany()
          if (!company) {
            await signOut()
            window.location.replace('/auth/signin?error=no-company')
            return
          }
        } catch {
          // If the RPC is not available yet, fallback to allow and rely on AuthGuard to enforce
        }
        window.location.replace('/app/dashboard')
      } else {
        window.location.replace('/auth/signin')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return <p className="p-4 text-center">Concluindo autenticação…</p>
}
