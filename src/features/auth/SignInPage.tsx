import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthContainer } from './AuthContainer'
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { GoogleLogo } from 'phosphor-react'

export default function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      navigate('/app/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })
      if (error) throw error
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao autenticar com Google')
      setLoading(false)
    }
  }

  return (
    <AuthContainer>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className='text-center'>Entrar na sua conta</CardTitle>
          <CardDescription className='text-center'>Informe seu e-mail para acessar sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <a href="/auth/forgot-password" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">Esqueceu a senha?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    {loading ? 'Entrando…' : 'Entrar'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
                <Button variant="outline" className="w-full" type="button" onClick={signInWithGoogle} disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    <GoogleLogo size={16} weight="fill" />
                    Entrar com o Google
                  </span>
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <a href="/auth/signup" className="underline underline-offset-4">Cadastre-se</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthContainer>
  )
}
