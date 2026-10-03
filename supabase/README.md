# Supabase

Infraestrutura de dados do projeto.

Estrutura planejada:

```text
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_functions.sql
│   ├── 003_rls.sql
│   └── 004_storage.sql
├── tests/
│   └── backend_validation.sql
└── seed.sql
```

As migrations representam a estrutura do banco e devem ser versionadas. O `seed.sql` contém somente dados fictícios de desenvolvimento.

Nunca incluir tokens reais de convites, dados pessoais reais de convidados, senhas, chaves do Supabase ou outras credenciais.
