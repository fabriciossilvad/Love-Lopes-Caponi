# Estágio 3 — Frontend: entrega 1

## Objetivo
Disponibilizar a primeira aplicação React executável, responsiva e integrada ao endpoint público de convite existente.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Fetch nativo
- Vitest + Testing Library
- Lucide React

## Escopo fechado da entrega 1
- Inicialização do projeto frontend e scripts de desenvolvimento, build, typecheck e testes.
- Configuração de ambiente para URL da API, sem credenciais secretas no navegador.
- Layout público inicial alinhado à identidade off-white, preto suave e dourado champagne.
- Rota `/convite/:token` e estados de carregamento, erro e convite inválido.
- Consumo de `GET /api/invitations/:token`.
- Exibição do nome do convite, convidados e eventos retornados.
- Responsividade mobile e desktop.

## Fora desta entrega
- Envio de RSVP.
- Catálogo e reserva de presentes.
- Autenticação e painel administrativo.
- Upload e gestão de conteúdo.
- Integração de pagamentos.

## Critérios de aceite
1. `npm install`, `npm run dev`, `npm run typecheck`, `npm run build` e `npm test` executam sem falhas.
2. O acesso com token válido exibe informações reais do convite.
3. Token inválido ou desabilitado apresenta erro amigável sem expor dados privados.
4. Falha de rede apresenta opção de tentar novamente.
5. O layout funciona em telas móveis e desktop.
6. Não há service role nem chave administrativa embutida no frontend.

## Dependência de integração
O backend deve estar acessível pelo frontend em desenvolvimento. Configurar proxy local do Vite ou CORS restrito à origem de desenvolvimento; não ampliar CORS indiscriminadamente.

## Sequência
1. Criar estrutura e dependências.
2. Implementar design base e roteamento.
3. Criar cliente HTTP tipado e página de convite.
4. Testar com token fictício de desenvolvimento e validar os critérios.
5. Somente então avançar para RSVP.
