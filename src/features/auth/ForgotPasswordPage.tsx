import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthContainer } from './AuthContainer'
import { MailQuestion, Mail, ArrowRight, Undo2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/reset-password' })
      if (error) throw error
      setInfo('We\'ve sent you an email with a link to reset your password.')
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao enviar e-mail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContainer>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <MailQuestion className="h-6 w-6" />
          </div>
          <CardTitle className='text-center'>Esqueceu sua senha?</CardTitle>
          <CardDescription className='text-center'>Informe seu e-mail para receber um link de redefinição</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {info && <p className="text-sm text-green-600">{info}</p>}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    {loading ? 'Enviando…' : 'Enviar link de redefinição'}
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
