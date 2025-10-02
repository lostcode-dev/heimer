import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiOrders } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import * as htmlToImage from 'html-to-image';

// We'll import export libs dynamically to avoid type resolution errors if not installed yet

export default function OrderDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (async () => {
      try {
        if (!id) return
        const data = await apiOrders.getById(id)
        setOrder(data)
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao carregar')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function exportPNG() {
    if (!printRef.current) return
    const dataUrl = await htmlToImage.toPng(printRef.current, { cacheBust: true })
    const link = document.createElement('a')
    link.download = `${order?.ticket_number || 'ordem'}.png`
    link.href = dataUrl
    link.click()
  }

  async function exportPDF() {
    if (!printRef.current) return
    const htmlToImage = await import('html-to-image')
    const { jsPDF } = await import('jspdf')
    const dataUrl = await htmlToImage.toPng(printRef.current, { cacheBust: true })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(dataUrl)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${order?.ticket_number || 'ordem'}.pdf`)
  }

  if (loading) return <div>Carregando…</div>
  if (!order) return <div>Não encontrado</div>

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Detalhes da Ordem</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
          <Button onClick={exportPNG}>Exportar PNG</Button>
          <Button onClick={exportPDF}>Exportar PDF</Button>
        </div>
      </div>

      <div ref={printRef} className="rounded-[14px] border bg-white p-4 text-sm text-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{order.ticket_number}</div>
            <div>Status: {order.status}</div>
          </div>
          <div className="text-right">
            <div>Cliente: {order.customer?.full_name ?? '-'}</div>
            <div>Email: {order.customer?.email ?? '-'}</div>
            <div>Telefone: {order.customer?.phone ?? '-'}</div>
          </div>
        </div>
        <hr className="my-3" />
        <div>
          <div className="font-medium">Problema relatado</div>
          <p className="whitespace-pre-wrap">{order.problem_description}</p>
        </div>
        {order.diagnostics && (
          <div className="mt-3">
            <div className="font-medium">Diagnóstico</div>
            <p className="whitespace-pre-wrap">{order.diagnostics}</p>
          </div>
        )}
        <div className="mt-3">
          <div className="font-medium">Valores</div>
          <div>Mão de obra: R$ {Number(order.labor_price || 0).toFixed(2)}</div>
          <div>Impostos: R$ {Number(order.tax_amount || 0).toFixed(2)}</div>
          <div>Desconto: R$ {Number(order.discount_amount || 0).toFixed(2)}</div>
          <div className="font-semibold">Total: R$ {Number(order.total_amount || 0).toFixed(2)}</div>
        </div>
      </div>
    </section>
  )
}
