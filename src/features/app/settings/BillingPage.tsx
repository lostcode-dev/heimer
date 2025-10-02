import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiBilling } from '@/lib/api'

type Subscription = any
type Invoice = any

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customer, setCustomer] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const data = await apiBilling.getOverview()
        setSubscription(data.subscription)
        setInvoices(data.invoices)
        setCustomer(data.customer)
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao carregar faturamento')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function openPortal() {
    try {
      const { url } = await apiBilling.createPortalSession()
      window.location.href = url
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível abrir o portal')
    }
  }

  async function startCheckout() {
    try {
      const { url } = await apiBilling.createCheckoutSession()
      window.location.href = url
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível iniciar a assinatura')
    }
  }

  const active = subscription && (subscription.status === 'active' || subscription.status === 'trialing')

  return (
    <section className="flex flex-1 flex-col gap-4 my-4 md:gap-6 mx-4 md:mx-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div>Carregando…</div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Cliente Stripe</div>
                <div className="text-base">{customer?.stripe_customer_id ? customer.stripe_customer_id : 'Não vinculado'}</div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-base capitalize">{subscription?.status ?? 'sem assinatura'}</div>
                {subscription?.current_period_end && (
                  <div className="text-sm">Próximo ciclo: {new Date(subscription.current_period_end).toLocaleDateString()}</div>
                )}
                <div className="flex gap-2 pt-2">
                  {active ? (
                    <Button onClick={openPortal}>Gerenciar pagamento</Button>
                  ) : (
                    <Button onClick={startCheckout}>Assinar plano</Button>
                  )}
                  {!active && customer?.stripe_customer_id && (
                    <Button variant="outline" onClick={openPortal}>Abrir portal</Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma fatura ainda</div>}
              {invoices.map((inv: any) => (
                <a key={inv.stripe_invoice_id} href={inv.hosted_invoice_url ?? '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border p-2 hover:bg-accent">
                  <div>
                    <div className="text-sm">{inv.stripe_invoice_id}</div>
                    <div className="text-xs text-muted-foreground">{inv.status}</div>
                  </div>
                  <div className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: (inv.currency || 'BRL').toUpperCase() }).format((inv.amount_paid ?? inv.amount_due ?? 0) / 100)}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
