# Oficina de Conserto (Vite + React + Supabase)

Aplicação web mobile-first para gestão de ordens de serviço de conserto de celulares.

- UI em Português (pt-BR). Código/DB em Inglês.
- Frontend: React 18/19 + TypeScript + Vite + Tailwind + React Router + React Query.
- Backend: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions).
- PWA com manifest e Service Worker.

## Configuração

1) Crie o arquivo `.env` baseado em `.env.example`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Billing (Stripe)

Integração de faturamento com Stripe para assinatura por empresa (tenant).

Tabelas (ver `supabase/migrations/0024_billing_stripe.sql`):
- `stripe_customers` (mapa empresa → cliente Stripe)
- `billing_subscriptions` (estado da assinatura)
- `billing_invoices` (últimas faturas/pagamentos)
- `stripe_events` (auditoria via Service Role)

Funções Edge:
- `stripe-webhook`: valida assinatura do Stripe e sincroniza subscriptions/invoices
- `stripe-portal`: cria sessão autenticada do Billing Portal ou Checkout

Frontend:
- Página em Configurações → Faturamento (`/app/settings/billing`) com status, faturas e ações

Variáveis de ambiente (no projeto Supabase → Functions):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID` (ID do Price do plano)
- `SITE_URL` (URL pública para retorno de sucesso/cancelamento)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

Passos:
1) Aplique as migrações
2) Publique as funções `stripe-webhook` e `stripe-portal`
3) Crie o endpoint de webhook no Stripe apontando para `https://<PROJECT_REF>.functions.supabase.co/stripe-webhook`
4) Assine os eventos: `customer.subscription.*`, `invoice.*`
5) Configure `STRIPE_PRICE_ID` e teste o fluxo via página de Faturamento

Boas práticas adotadas:
- RLS por `company_id` em todas as tabelas de billing
- Webhook assinado e executado com Service Role
- Portal/Checkout autenticados, derivando `company_id` via `current_company_id()`
- Sem expor segredos no cliente; chamadas passam por funções Edge
2) Instale e rode:

```
npm install
npm run dev
```

3) Supabase
- Rode as migrações em `supabase/migrations`.
- Publique as Edge Functions em `supabase/functions` (close-cash-session).

## Scripts
- dev, build, preview, lint

### Seed de dados (multitenant)

Para popular o banco com dados de exemplo (2 empresas e 10+ registros por tabela):

1) Certifique-se que as variáveis de ambiente de servidor estão definidas (no shell):

- SUPABASE_URL (mesmo valor de VITE_SUPABASE_URL)
- SUPABASE_SERVICE_ROLE_KEY (chave Service Role do projeto)

2) Rode o seed:

```
npm run seed
```

Observações:
- O seed usa a Service Role para inserir dados ignorando RLS e preenche o campo company_id em todas as tabelas de domínio.
- Tabelas opcionais (ex.: audit_logs com company_id) são ignoradas se o schema divergir.
- Usuários seed são criados via Admin API e vinculados à empresa em `user_companies`.

## Estrutura
- `src/app` rotas e guards
- `src/features/*` telas (clientes, produtos, ordens, caixa)
- `src/lib` i18n e supabase client
- `src/locales` traduções
- `supabase` migrations, functions e seed
