import { Badge } from "@/components/ui/badge"

export function HowItWorksSection() {
  return (
    <section className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full  bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" style={{
        backgroundImage: `linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)`
      }}></div>
      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            Como funciona
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Implante em poucas etapas</h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Cadastre produtos e clientes, configure seu caixa e comece a vender com controle total.
          </p>
  </div>
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {[
            {
              step: "01",
              title: "Configure o básico",
              description: "Cadastre produtos, categorias e clientes, e ajuste as preferências do seu negócio.",
            },
            {
              step: "02",
              title: "Ative o PDV",
              description: "Abra o caixa, escolha as formas de pagamento e comece a registrar vendas.",
            },
            {
              step: "03",
              title: "Acompanhe resultados",
              description: "Veja relatórios de vendas, estoque e financeiro para tomar melhores decisões.",
            },
          ].map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg">
                {step.step}
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
