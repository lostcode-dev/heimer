import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
//

export function PricingSection() {
  const plans = {
    monthly: [
      {
        name: "Starter",
        price: "R$49",
        monthly: true,
        description: "Para começar com o essencial",
        features: [
          "Cadastro de clientes",
          "Ordem de serviço",
          "Relatórios básicos",
          "Suporte por e-mail",
        ],
        cta: "Começar agora",
      },
      {
        name: "Professional",
        price: "R$99",
        monthly: true,
        description: "Tudo para operar vendas e financeiro",
        features: [
          "Clientes e OS",
          "Produtos e estoque",
          "Financeiro (AR/AP e caixa)",
          "Relatórios avançados",
          "Suporte prioritário",
        ],
        cta: "Começar agora",
        popular: true,
      },
      {
        name: "Enterprise",
        price: "Fale com vendas",
        description: "Para operações com necessidades avançadas",
        features: [
          "Uso ilimitado",
          "Integrações",
          "Customizações",
          "Suporte premium",
        ],
        cta: "Falar com vendas",
      },
    ],
    annually: [
      {
        name: "Starter",
        price: "R$39",
        monthly: true,
        description: "Para começar com o essencial",
        features: [
          "Cadastro de clientes",
          "Ordem de serviço",
          "Relatórios básicos",
          "Suporte por e-mail",
        ],
        cta: "Começar agora",
      },
      {
        name: "Professional",
        price: "R$79",
        monthly: true,
        description: "Tudo para operar vendas e financeiro",
        features: [
          "Clientes e OS",
          "Produtos e estoque",
          "Financeiro (AR/AP e caixa)",
          "Relatórios avançados",
          "Suporte prioritário",
        ],
        cta: "Começar agora",
        popular: true,
      },
      {
        name: "Enterprise",
        price: "Fale com vendas",
        description: "Para operações com necessidades avançadas",
        features: [
          "Uso ilimitado",
          "Integrações",
          "Customizações",
          "Suporte premium",
        ],
        cta: "Falar com vendas",
      },
    ],
  }
  return (
    <section id="pricing" className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full  bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" style={{
        backgroundImage: `linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)`
      }}></div>
      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            Planos e preços
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Comece no seu ritmo</h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Escolha o plano ideal para o seu negócio. Você pode mudar quando quiser.
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="monthly" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="rounded-full p-1">
                <TabsTrigger value="monthly" className="rounded-full px-6">
                  Mensal
                </TabsTrigger>
                <TabsTrigger value="annually" className="rounded-full px-6">
                  Anual
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="monthly">
              <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                {plans.monthly.map((plan, i) => (
                  <div key={i}>
                    <Card
                      className={`relative overflow-hidden h-full ${plan.popular ? "border-primary shadow-lg" : "border-border/40 shadow-md"} bg-gradient-to-b from-background to-muted/10 backdrop-blur`}
                    >
                          {plan.popular && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                          Mais popular
                        </div>
                      )}
                      <CardContent className="p-6 flex flex-col h-full">
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline mt-4">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          {plan.monthly && <span className="text-muted-foreground ml-1">/ mês</span>}
                        </div>
                        <p className="text-muted-foreground mt-2">{plan.description}</p>
                        <ul className="space-y-3 my-6 flex-grow">
                          {plan.features.map((feature, j) => (
                            <li key={j} className="flex items-center">
                              <Check className="mr-2 size-4 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full mt-auto rounded-full ${plan.popular ? "bg-primary hover:bg-primary/90" : "bg-muted hover:bg-muted/80"}`}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          {plan.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="annually">
              <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                {plans.annually.map((plan, i) => (
                  <div key={i}>
                    <Card
                      className={`relative overflow-hidden h-full ${plan.popular ? "border-primary shadow-lg" : "border-border/40 shadow-md"} bg-gradient-to-b from-background to-muted/10 backdrop-blur`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                          Mais popular
                        </div>
                      )}
                      <CardContent className="p-6 flex flex-col h-full">
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline mt-4">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          {plan.monthly && <span className="text-muted-foreground ml-1">/ mês</span>}
                        </div>
                        <p className="text-muted-foreground mt-2">{plan.description}</p>
                        <ul className="space-y-3 my-6 flex-grow">
                          {plan.features.map((feature, j) => (
                            <li key={j} className="flex items-center">
                              <Check className="mr-2 size-4 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full mt-auto rounded-full ${plan.popular ? "bg-primary hover:bg-primary/90" : "bg-muted hover:bg-muted/80"}`}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          {plan.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
