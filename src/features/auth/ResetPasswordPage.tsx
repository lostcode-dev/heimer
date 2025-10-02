import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthContainer } from './AuthContainer'
import { LockKeyhole, Lock, CheckCircle2, Undo2, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    // Ensure we have a recovery session; Supabase will set it after clicking the email link
    supabase.auth.getSession()
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
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setInfo('Senha atualizada. Você já pode entrar.')
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao atualizar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContainer>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle className='text-center'>Defina uma nova senha</CardTitle>
          <CardDescription className='text-center'>Digite e confirme sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="password">Nova senha</Label>
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
              {error && <p className="flex items-center gap-2 text-sm text-red-600"><LockKeyhole className="h-4 w-4" />{error}</p>}
              {info && <p className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" />{info}</p>}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    {loading ? 'Atualizando…' : 'Atualizar senha'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/auth/signin" className="inline-flex items-center gap-2">
                    <Undo2 className="h-4 w-4" />
                    Voltar para o login
                  </a>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthContainer>
  )
}
