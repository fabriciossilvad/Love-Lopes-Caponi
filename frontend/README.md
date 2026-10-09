# Frontend — Love, Lopes & Caponi

Frontend público do projeto, em React, TypeScript, Vite e Tailwind CSS.

## Pré-requisitos

- Node.js 22 ou superior
- Backend local executando em http://localhost:3001

## Executar localmente

No diretório `frontend`:

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Abra http://localhost:5173.

## Testar o convite

Com o backend local ativo e dados de desenvolvimento carregados, abra:

```text
http://localhost:5173/convite/TESTE-FAMILIA-SILVA-2027-AAAA
```

O Vite encaminha as chamadas `/api` ao backend local na porta 3001. Tokens de teste são apenas para ambiente de desenvolvimento e nunca devem ser utilizados em produção.

## Escopo desta entrega

- Home provisória
- Rota de convite com nome, convidados e eventos
- RSVP individual por convidado e evento, com bloqueio por prazo e feedback de salvamento
- Catálogo de presentes por evento, reserva e cancelamento na sessão atual
- Estados de carregamento, token inválido e falha de rede
- Testes básicos do serviço HTTP

Ainda não inclui painel administrativo. A identificação da reserva para cancelamento não é recuperável após recarregar a página; as imagens dos presentes ainda usam ícones provisórios. Consulte `docs/07-frontend-entrega-1.md`.

## Segurança

O frontend não utiliza credenciais administrativas nem `service_role`. O token do convite é uma credencial e não deve ser incluído em logs, ferramentas de analytics ou compartilhado fora do contexto do convite.
