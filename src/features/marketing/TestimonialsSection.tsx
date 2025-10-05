import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    { quote: "Implantamos em poucos dias e reduzimos erros no caixa.", author: "Juliana", role: "Loja de acessórios", rating: 5 },
    { quote: "Controle real de estoque e recebíveis. Salvou meu tempo.", author: "Rafael", role: "Assistência técnica", rating: 5 },
    { quote: "PDV rápido e suporte atencioso.", author: "Carla", role: "Loja de celulares", rating: 5 },
    { quote: "Relatórios claros para decidir melhor.", author: "Marcos", role: "Rede varejista", rating: 5 },
    { quote: "Clientes mais satisfeitos com histórico unificado.", author: "Ana", role: "Estúdio de serviços", rating: 5 },
    { quote: "Financeiro integrado tirou o peso das planilhas.", author: "Diego", role: "Comércio local", rating: 5 },
  ]
  return (
    <section id="testimonials" className="w-full py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            Depoimentos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Quem usa recomenda</h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Histórias reais de quem simplificou vendas e finanças com o Heimer.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div key={i}>
              <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex mb-4">
                    {Array(testimonial.rating)
                      .fill(0)
                      .map((_, j) => (
                        <Star key={j} className="size-4 text-yellow-500 fill-yellow-500" />
                      ))}
                  </div>
                  <p className="text-lg mb-6 flex-grow">{testimonial.quote}</p>
                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/40">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}