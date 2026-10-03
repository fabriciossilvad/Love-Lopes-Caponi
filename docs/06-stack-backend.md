# Stack do Backend — Estágio 2

## Decisão

O backend do **Love, Lopes & Caponi** será desenvolvido como uma API REST independente usando **Node.js + TypeScript + Fastify**.

### Stack

| Área | Tecnologia |
|---|---|
| Runtime | Node.js 22 LTS |
| Linguagem | TypeScript |
| Framework HTTP | Fastify |
| Validação | Zod |
| Banco | PostgreSQL via Supabase |
| Supabase | @supabase/supabase-js |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Logs | Pino/Fastify Logger |
| Testes | Vitest + Fastify inject |
| Gerenciador | npm |
| Contrato | REST/JSON |

## Decisões arquiteturais

### API independente
O frontend consumirá contratos HTTP do backend. O backend concentra validação de entrada, autorização, privacidade, tratamento de erros e orquestração.

### Sem ORM inicialmente
Não será adotado Prisma, TypeORM ou outro ORM nesta fase. O banco já possui schema, constraints, RLS e funções/RPC responsáveis por regras críticas. Adicionar uma segunda representação do domínio aumentaria complexidade sem benefício suficiente para o MVP.

### Regras críticas permanecem no PostgreSQL
Concorrência de reservas, integridade referencial e outras invariantes continuam garantidas no banco. A API não substitui essas garantias.

### Supabase
O backend utilizará Supabase para PostgreSQL, Auth, Storage e RPC. A `service_role` nunca poderá ser exposta ao frontend.

### Acesso administrativo
Administradores autenticam pelo Supabase Auth. A API validará a identidade/autorização antes das operações administrativas, mantendo RLS como camada adicional de proteção.

### Acesso de convidados
Convidados não terão conta. O token de convite funciona como credencial limitada ao escopo daquele convite. Dados sensíveis não serão expostos por acesso direto às tabelas.

### Organização
Será adotada arquitetura modular simples, evitando abstrações prematuras:

```text
route -> controller -> service -> Supabase/PostgreSQL
```

Camadas poderão ser reduzidas quando não trouxerem valor ao módulo.

## Alternativa avaliada

ASP.NET Core/C# foi considerado e atenderia tecnicamente ao projeto. Node.js/TypeScript foi escolhido pela menor fricção com o ecossistema web planejado, simplicidade operacional e possibilidade de manter frontend e backend no mesmo ecossistema JavaScript/TypeScript.

## Princípios

- simplicidade antes de abstração;
- segurança por padrão;
- validação de entradas;
- segredos somente por variáveis de ambiente;
- regras críticas garantidas no banco;
- módulos pequenos e coesos;
- testes para fluxos críticos;
- sem microserviços, filas, Redis, GraphQL ou outras dependências sem necessidade concreta.
