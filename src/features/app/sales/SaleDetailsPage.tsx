import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiSales } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { formatBRL, formatDateTimeBR } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Image, FileText, NotebookPen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import * as htmlToImage from 'html-to-image'

export default function SaleDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [sale, setSale] = useState<any>(null)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        (async () => {
            try {
                if (!id) return
                const data = await apiSales.getPosSale(id)
                setSale(data)
            } finally { setLoading(false) }
        })()
    }, [id])

    async function exportPNG() {
        if (!printRef.current) return
        const dataUrl = await htmlToImage.toPng(printRef.current, { cacheBust: true })
        const link = document.createElement('a')
        link.download = `${sale?.id || 'venda'}.png`
        link.href = dataUrl
        link.click()
    }

    async function exportPDF() {
        if (!printRef.current) return
        const { jsPDF } = await import('jspdf')
        const dataUrl = await htmlToImage.toPng(printRef.current, { cacheBust: true })
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgProps = pdf.getImageProperties(dataUrl)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`${sale?.id || 'venda'}.pdf`)
    }

    if (loading) {
        return (
            <section className="space-y-4">
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-44" />
                        <div className="flex gap-2">
                            <Skeleton className="size-9 rounded" />
                            <Skeleton className="size-9 rounded" />
                            <Skeleton className="size-9 rounded" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                        {[0, 1, 2].map(i => (
                            <Card key={i} className="p-3">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="size-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <Card className="p-3 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </Card>
                </Card>
            </section>
        )
    }
    if (!sale) return <div>Não encontrada</div>

    const total = Number(sale.total || 0)
    return (
        <section className="space-y-4">
            <div ref={printRef} className="rounded-[14px] border bg-white p-4 text-sm text-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-lg font-semibold">Venda PDV</div>
                        <div className="text-xs text-muted-foreground">Registrada em {formatDateTimeBR(sale.occurred_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)} title="Voltar" aria-label="Voltar">
                            <ArrowLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={exportPNG} title="Exportar PNG" aria-label="Exportar PNG">
                            <Image className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={exportPDF} title="Exportar PDF" aria-label="Exportar PDF">
                            <FileText className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <Card className="p-3">
                        <div>
                            <div className="text-xs text-muted-foreground mb-2">Cliente</div>
                            <NameWithAvatar name={sale.customer?.full_name ?? '-'} phone={sale.customer?.phone ?? undefined} />
                        </div>
                    </Card>
                    <Card className="p-3">
                        <div>
                            <div className="text-xs text-muted-foreground mb-2">Vendedor</div>
                            <NameWithAvatar name={sale.seller?.full_name ?? '-'} phone={sale.seller?.phone ?? undefined} />
                        </div>
                    </Card>
                    <Card className="p-3">
                        <div>
                            <div className="text-xs text-muted-foreground mb-2">Pagamentos</div>
                            <div className="flex flex-wrap gap-1">
                                {(Array.from(new Set((sale.payments ?? []).map((p: any) => p.method))) as string[]).map((m) => (
                                    <Badge key={m} variant="outline">{({ CASH: 'Dinheiro', CARD: 'Cartão', PIX: 'PIX', TRANSFER: 'Transf.', FIADO: 'Fiado' } as any)[m] ?? m}</Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-3">
                    <div>
                        <div className="font-medium flex items-center gap-2"><NotebookPen className="size-4" /> Itens</div>
                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-muted-foreground">
                                        <th className="px-2 py-1">SKU</th>
                                        <th className="px-2 py-1">Produto</th>
                                        <th className="px-2 py-1 w-20">Qtde</th>
                                        <th className="px-2 py-1 w-28">Preço (R$)</th>
                                        <th className="px-2 py-1 w-28">Total (R$)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(sale.items ?? []).map((it: any) => (
                                        <tr key={it.id} className="border-t">
                                            <td className="px-2 py-1">{it.product?.sku ?? '-'}</td>
                                            <td className="px-2 py-1">{it.product?.name ?? '-'}</td>
                                            <td className="px-2 py-1">{it.qty}</td>
                                            <td className="px-2 py-1">{formatBRL(Number(it.unit_price || 0))}</td>
                                            <td className="px-2 py-1">{formatBRL(Number(it.total || (Number(it.qty || 0) * Number(it.unit_price || 0))))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                <Card className="p-3">
                    <div>
                        <div className="font-medium mb-1">Valores</div>
                        <div className="grid md:grid-cols-4 gap-2">
                            <div className="font-semibold">Total: {formatBRL(total)}</div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    )
}
