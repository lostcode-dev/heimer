import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "O PDV permite várias formas de pagamento?",
      answer: "Sim. Você pode dividir por dinheiro, cartão, PIX e transferência. Para cartão, dá para escolher o número de parcelas e ver a simulação.",
    },
    {
      question: "O estoque baixa automaticamente nas vendas?",
      answer: "Sim. Cada item vendido reduz o estoque e você acompanha os movimentos na área de estoque.",
    },
    {
      question: "Consigo controlar contas a pagar e receber?",
      answer: "Sim. O módulo financeiro inclui contas a receber/pagar, filtros por período e status, e lembretes de vencimentos.",
    },
    {
      question: "Existe histórico do cliente?",
      answer: "Sim. Na ficha do cliente você vê compras, recebíveis e informações principais em um só lugar.",
    },
    {
      question: "Preciso de cartão de crédito para testar?",
      answer: "Não. O teste é gratuito e você pode cancelar quando quiser.",
    },
    {
      question: "O suporte é em português?",
      answer: "Sim. Oferecemos suporte em português e materiais de ajuda para acelerar sua implantação.",
    },
  ]
  return (
    <section id="faq" className="w-full py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            Dúvidas frequentes
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tudo o que você precisa saber</h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Respondemos as perguntas mais comuns sobre vendas, financeiro e implantação.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <div key={i}>
                <AccordionItem value={`item-${i}`} className="border-b border-border/40 py-2">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}