import { Badge } from '@/components/ui/badge'

export default function ReportsPage() {
  const sections: Array<{ title: string; items: string[] }> = [
    {
      title: 'Visão Geral',
      items: [
        'Indicadores principais (faturamento, ticket médio, pedidos, clientes atendidos)',
        'Tendência por período (comparativo com período anterior)',
      ],
    },
    {
      title: 'Vendas',
      items: [
        'Receita por período (por dia/semana/mês)',
        'Produtos mais vendidos (quantidade e valor)',
        'Categorias e tags mais relevantes',
      ],
    },
    {
      title: 'Serviços',
      items: [
        'Status das ordens (abertas, em progresso, prontas, entregues, canceladas)',
        'Produtividade por técnico (serviços concluídos, valor gerado)',
        'Tempo médio de ciclo por status',
      ],
    },
    {
      title: 'Caixa',
      items: [
        'Resumo por sessão (abertura, fechamento, saldo, diferenças)',
        'Movimentações por tipo (entradas, saídas, ajustes)',
        'Meios de pagamento (cartão, dinheiro, pix, etc.)',
      ],
    },
    {
      title: 'Clientes',
      items: [
        'Novos vs recorrentes (no período)',
        'Clientes com débitos/em aberto',
        'Top clientes por faturamento',
      ],
    },
  ]

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Relatórios</h2>
        <p className="text-sm text-muted-foreground">Abaixo estão as ideias de relatórios a serem implementados. Clique em um item para priorizar no backlog.</p>
      </div>

      <div className="grid gap-6">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-3">
            <h3 className="text-lg font-medium">{sec.title}</h3>
            <ul className="grid gap-2 md:grid-cols-2">
              {sec.items.map((it) => (
                <li key={it} className="flex items-start gap-2 rounded border p-3 hover:bg-accent/50">
                  <Badge variant="outline" className="mt-0.5">Ideia</Badge>
                  <span className="text-sm leading-6">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
