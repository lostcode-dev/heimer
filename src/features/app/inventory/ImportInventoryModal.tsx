import { useRef, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import { Button } from '@/components/ui/button'
import { Upload, Download } from 'lucide-react'

export type ImportedRow = { sku: string; qty: number; type: 'IN'|'OUT'|'ADJUSTMENT'; reason?: string | null; occurred_at?: string }

export default function ImportInventoryModal({ open, onOpenChange, onDownloadSample, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; onDownloadSample: () => void; onConfirm: (rows: ImportedRow[]) => void }) {
  const [fileName, setFileName] = useState<string>('')
  const [rows, setRows] = useState<Array<ImportedRow>>([])
  const [, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function parseCSV(text: string) {
    // very simple CSV parser expecting header: sku,qty,type,reason,occurred_at
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (!lines.length) return []
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idx = (name: string) => header.indexOf(name)
  const out: Array<ImportedRow> = []
    for (let i=1;i<lines.length;i++) {
      const raw = lines[i]
      if (!raw.trim()) continue
      const cols = raw.match(/((?:\"(?:[^\"]|\"")*\")|[^,]+)/g) || []
      const val = (j: number) => (cols[j] ?? '').replace(/^\"|\"$/g, '').replace(/\"\"/g, '"')
      const sku = val(idx('sku'))
      const qty = Number(val(idx('qty')) || '0')
      const type = (val(idx('type')).toUpperCase() as 'IN'|'OUT'|'ADJUSTMENT')
      const reason = val(idx('reason')) || null
      const occurred_at = val(idx('occurred_at')) || undefined
      if (!sku || !qty || !type) continue
      out.push({ sku, qty, type, reason, occurred_at })
    }
    return out
  }

  async function handleFile(file: File) {
    setParsing(true); setError(null)
    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      setRows(parsed)
      setFileName(file.name)
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao ler arquivo')
    } finally { setParsing(false) }
  }

  return (
    <CustomForm
      open={open}
      onOpenChange={onOpenChange}
      title="Importar estoque"
      onSubmit={(e) => { e.preventDefault(); if (rows.length) onConfirm(rows) }}
      submitLabel={`Importar${rows.length ? ` (${rows.length})` : ''}`}
      submitDisabled={!rows.length}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Faça download do modelo, preencha os dados e importe o arquivo CSV. Colunas esperadas:
          <strong> sku, qty, type, reason, occurred_at</strong> (type: IN | OUT | ADJUSTMENT). Datas no formato ISO.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDownloadSample}><Download className="size-4 mr-2" /> Baixar modelo</Button>
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><Upload className="size-4 mr-2" /> Selecionar arquivo</Button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
        </div>
        {fileName && (
          <div className="text-sm">Arquivo: <span className="font-medium">{fileName}</span> — {rows.length} linha(s) válida(s)</div>
        )}
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div className="text-xs text-muted-foreground">
          Dicas:
          <ul className="list-disc pl-4 space-y-1">
            <li>SKU deve existir no catálogo de produtos.</li>
            <li>Se o estoque computado é por movimentos, importar tipo IN/OUT ajusta corretamente.</li>
            <li>Para correções pontuais, use ADJUSTMENT com a diferença desejada.</li>
          </ul>
        </div>
      </div>
    </CustomForm>
  )
}
