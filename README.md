# Love, Lopes & Caponi

Monorepo do site de casamento **Love, Lopes & Caponi**.

## Estrutura

```text
Love-Lopes-Caponi/
├── backend/              # API e regras da aplicação
├── frontend/             # Site público e painel administrativo
├── supabase/
│   ├── migrations/       # Schema, funções, RLS e Storage
│   ├── tests/            # Validações SQL
│   └── seed.sql          # Dados fictícios de desenvolvimento
├── docs/                 # Documentação técnica e funcional
├── .env.example          # Modelo de variáveis de ambiente
├── .gitignore
└── README.md
```

## Status

**Estágio 1 — concluído:** definição do MVP, regras de negócio, modelo de dados, schema PostgreSQL, funções críticas, RLS, Storage, primeiro administrador, seed e validação das regras principais.

**Estágio 2 — em andamento:** desenvolvimento do backend/API.

## Segurança

Nunca versionar:

- arquivos `.env` reais;
- `SUPABASE_SERVICE_ROLE_KEY` ou outras chaves privadas;
- senhas, tokens de autenticação ou certificados;
- tokens reais de convites;
- dados pessoais reais de convidados;
- dumps de produção.

O arquivo `.env.example` contém apenas os nomes/configurações de exemplo que podem ser versionados.

## Banco de dados

As migrations do Supabase são mantidas em `supabase/migrations/`. Dados fictícios de desenvolvimento ficam em `supabase/seed.sql` e validações SQL em `supabase/tests/`.

## Desenvolvimento

A definição da stack e a inicialização efetiva de `backend/` são o próximo passo do projeto. O frontend será iniciado depois que os principais contratos do backend estiverem definidos e validados.
