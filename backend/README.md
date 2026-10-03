# Backend — Love, Lopes & Caponi

API REST do projeto.

## Stack

- Node.js 22+
- TypeScript
- Fastify
- Zod
- Supabase
- Vitest

A decisão completa está documentada em [`docs/06-stack-backend.md`](../docs/06-stack-backend.md).

## Estrutura inicial

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── supabase.ts
│   ├── modules/
│   │   └── health/
│   │       └── health.routes.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   └── health.test.ts
├── .env.example
├── package.json
└── tsconfig.json
```

Novos módulos serão adicionados conforme os contratos da API forem implementados.

## Executando localmente

Pré-requisito: Node.js 22 ou superior.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

No Windows/PowerShell, copie o arquivo de ambiente com:

```powershell
Copy-Item .env.example .env
```

Preencha as variáveis do Supabase no `.env`. Esse arquivo é ignorado pelo Git.

Por padrão:

```text
GET http://localhost:3001/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "love-lopes-caponi-api",
  "timestamp": "..."
}
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm test
npm run test:watch
```

## Segurança

Nunca versionar o `.env` real nem a `SUPABASE_SERVICE_ROLE_KEY`. A chave de service role é exclusiva do servidor e jamais deve ser enviada ao navegador.

O cliente administrativo definido na configuração não implica que todas as operações usarão `service_role`. O uso será restrito aos fluxos em que for realmente necessário; autenticação, autorização e RLS continuarão fazendo parte do desenho da aplicação.
