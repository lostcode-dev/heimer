import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router"
import { normalizeLink } from "@/lib/utils"

export function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      <div className="container px-4 md:px-6 relative">
        <div
          className="absolute inset-0 -z-10 h-full w-full bg-background bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #f0f0f0 1px, transparent 1px),
              linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
            `
          }}
        ></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            O PDV que integra vendas, estoque e financeiro
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Vendas sem fricção. Financeiro no controle.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Multi-itens, multi-pagamentos, AR/AP, caixa e histórico do cliente — tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="rounded-full h-12 px-8 text-base"
              onClick={() => navigate(normalizeLink("/auth/signup"))}
            >
              Começar agora grátis
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base">
              Agendar demonstração
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="size-4 text-primary" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="size-4 text-primary" />
              <span>Teste gratuito</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="size-4 text-primary" />
              <span>Cancelamento a qualquer momento</span>
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
            <img
              src="https://cdn.dribbble.com/userupload/12302729/file/original-fa372845e394ee85bebe0389b9d86871.png?resize=1504x1128&vertical=center"
              width={1280}
              height={720}
              alt="dashboard"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
          </div>
          <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70"></div>
          <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70"></div>
  </div>
      </div>
    </section>
  )
}
