import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthContainer } from './AuthContainer'
import { UserPlus, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SignUpPage() {
  const navigate = useNavigate()
  const redirectTimer = useRef<number | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current)
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (password !== confirm) {
      setError('As senhas não conferem')
      return
    }
    setLoading(true)
    try {
      // Server-side bootstrap: create auth user, company, and membership atomically
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, company_name: companyName || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha no cadastro')
      setInfo('Conta criada! Faça login para continuar.')
      toast.success('Conta criada com sucesso!', {
        description: 'Você será redirecionado para o login em 3 segundos.',
      })
      redirectTimer.current = window.setTimeout(() => { navigate('/auth/signin') }, 3000)
    } catch (err: any) {
      setError(err?.message ?? 'Falha no cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContainer>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className='text-center'>Crie sua conta</CardTitle>
          <CardDescription className='text-center'>Informe seu e-mail e senha para se cadastrar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="company">Nome da empresa</Label>
                <Input id="company" placeholder="Ex.: Minha Assistência" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Senha</Label>
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
              <div className="grid gap-3">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    title={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {info && <p className="text-sm text-green-600">{info}</p>}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    {loading ? 'Enviando…' : 'Cadastrar'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/auth/signin">Voltar para o login</a>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthContainer>
  )
}
