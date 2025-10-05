import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, BarChart, Users, Shield, Layers, Star } from "lucide-react"

export function FeaturesSection() {
  //
  const features = [
    {
      title: "PDV ágil e intuitivo",
      description: "Carrinho com múltiplos itens, várias formas de pagamento e baixa automática no estoque.",
      icon: <Zap className="size-5" />,
    },
    {
      title: "Relatórios e indicadores",
      description: "Acompanhe vendas, fluxo de caixa e recebíveis com visão por período e status.",
      icon: <BarChart className="size-5" />,
    },
    {
      title: "Time e clientes conectados",
      description: "Histórico do cliente, detalhes de compras e melhor atendimento no dia a dia.",
      icon: <Users className="size-5" />,
    },
    {
      title: "Segurança e confiabilidade",
      description: "Camadas de segurança e registros consistentes do financeiro ao estoque.",
      icon: <Shield className="size-5" />,
    },
    {
      title: "Integrações essenciais",
      description: "Conecte com ferramentas do seu negócio e mantenha tudo sincronizado.",
      icon: <Layers className="size-5" />,
    },
    {
      title: "Suporte que resolve",
      description: "Materiais de ajuda e atendimento em português para acelerar sua implantação.",
      icon: <Star className="size-5" />,
    },
  ]
  return (
    <section id="features" className="w-full py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            Recursos principais
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tudo que o seu PDV precisa</h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Gestão de vendas, clientes, estoque e financeiro — simples de usar e pronto para crescer.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i}>
              <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
