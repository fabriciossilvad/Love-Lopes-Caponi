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
- Catálogo de presentes por evento, reserva e cancelamento com recuperação após recarregar a página (exige migration 009 no Supabase)
- Estados de carregamento, token inválido e falha de rede
- Testes básicos do serviço HTTP

Ainda não inclui painel administrativo. As imagens dos presentes ainda usam ícones provisórios. O acesso às reservas é por token compartilhado do convite (não por identidade individual). Consulte `docs/07-frontend-entrega-1.md`.

## Segurança

O frontend não utiliza credenciais administrativas nem `service_role`. O token do convite é uma credencial e não deve ser incluído em logs, ferramentas de analytics ou compartilhado fora do contexto do convite.


## Recuperação das reservas

1. Execute `supabase/migrations/009_list_invitation_gift_reservations.sql` no SQL Editor do Supabase.
2. Reinicie o backend após atualizar o repositório.
3. `GET /api/gift-reservations?token=<token-do-convite>` retorna somente reservas ativas do convite (sem identidade dos reservantes).
4. Ao recarregar a página, o catálogo recupera as reservas e habilita o cancelamento.

**Privacidade:** qualquer pessoa com o link do convite pode ver e cancelar as reservas desse convite. Não compartilhe o token em logs ou capturas de tela. O endpoint não permite consultar reservas de outros convites sem o token correspondente.


## Painel administrativo — eventos

Acesse `/admin/login` com uma conta ativa de administrador. O módulo `/admin/eventos` permite listar, criar e editar eventos via `GET /api/admin/events`, `POST /api/admin/events` e `PATCH /api/admin/events/:eventId`.

- Datas inseridas em `datetime-local` são convertidas para ISO UTC antes do envio; na edição, são exibidas no fuso local do navegador.
- Status: `DRAFT`, `ACTIVE`, `FINISHED`.
- O prazo de RSVP não pode ser posterior à data do evento.
- Não há exclusão de eventos nesta entrega.
- Antes de criar registros de teste, prefira editar um evento de teste existente ou usar um identificador exclusivo; o cadastro persiste no Supabase conectado.


## Painel administrativo — convites

Em `/admin/convites`, administradores podem listar, criar e editar convites, abrir os detalhes com convidados e RSVP e copiar o link público individual. O token é gerado pelo backend e não deve ser publicado em logs, prints ou documentos.

A associação de convidados a eventos não é feita diretamente pelo convite: a API expõe essas associações em `guests[].guest_events[]`. A edição de convidados e suas participações será implementada no módulo seguinte.

Endpoints utilizados: `GET /api/admin/invitations`, `GET /api/admin/invitations/:invitationId`, `POST /api/admin/invitations`, `PATCH /api/admin/invitations/:invitationId`.

Atenção: convites novos são persistidos no Supabase conectado. Use nomes de teste e não compartilhe links de teste com convidados reais.


## Painel administrativo — convidados

Em `/admin/convidados`, o administrador pode cadastrar convidados em convites existentes, definir pelo menos um evento, editar dados e atualizar os eventos associados. A listagem reúne convidados a partir dos detalhes de cada convite, incluindo RSVP por evento. Endpoints: `POST /api/admin/guests`, `PATCH /api/admin/guests/:guestId`, `PUT /api/admin/guests/:guestId/events`, além de listagem/detalhes de convites e listagem de eventos.

**Limitações desta entrega:** a API atual não permite mudar o convite de um convidado já cadastrado nem deixar um convidado sem eventos. A edição de dados e a atualização dos vínculos são duas chamadas distintas; se a segunda falhar, a primeira poderá já estar persistida. A alteração de vínculos de eventos pode impactar respostas RSVP existentes. Faça testes com registros de teste e verifique o resultado após atualizar a página.


## Painel administrativo — presentes e imagens

Em `/admin/presentes`, é possível listar, criar e editar presentes, definir evento, descrição, valor estimado, quantidade, ordem e status. O formulário aceita imagem JPEG/PNG/WebP de até 5 MB. O upload é enviado após salvar o registro, por `POST /api/admin/gifts/:giftId/image`, e é armazenado no bucket `gift-images` do Supabase Storage. O catálogo público agora usa `image_url` retornado pela API, mantendo o ícone padrão para presentes sem imagem.

Endpoints administrativos: `GET /api/admin/gifts`, `POST /api/admin/gifts`, `PATCH /api/admin/gifts/:giftId`, `POST /api/admin/gifts/:giftId/image`. A API pública `GET /api/events/:eventId/gifts?token=...` acrescenta `image_url` quando `image_path` estiver presente.

**Limitações:** categorias existentes são preservadas durante a edição, mas não há seleção de categorias nesta primeira interface. A gestão detalhada de reservas ainda não foi implementada no painel. O upload não é transacional com a criação/edição: se falhar, o presente permanece salvo e a imagem pode ser reenviada pela edição. As imagens públicas exigem que o bucket `gift-images` esteja configurado para leitura pública conforme as migrations e políticas do projeto.
