# Encerramento do Estágio 1

## Objetivo da fase

Definir o produto e construir uma fundação de dados segura antes do desenvolvimento do backend e frontend.

## Concluído

- Escopo do MVP definido.
- Requisitos funcionais e não funcionais consolidados.
- Regras de negócio RN01–RN34 documentadas.
- Modelo conceitual e lógico definido.
- Projeto Supabase criado.
- `001_initial_schema.sql` aplicado.
- `002_functions.sql` aplicado.
- `003_rls.sql` aplicado.
- `004_storage.sql` aplicado.
- Buckets `wedding-gallery` e `gift-images` configurados.
- Primeiro usuário criado no Supabase Auth e vinculado como administrador.
- `seed.sql` criado e executado com dados fictícios.
- `backend_validation.sql` criado e executado.
- Fluxos críticos de RSVP e reserva validados no banco.
- Monorepo inicial criado e protegido por `.gitignore`.

## Validações realizadas

O roteiro SQL validou:
- alteração válida de RSVP;
- bloqueio de operação com token pertencente a outro convite;
- reserva válida;
- bloqueio da segunda reserva quando a quantidade é 1;
- cancelamento preservando histórico;
- retorno da unidade à disponibilidade;
- nova reserva após liberação;
- consistência entre `guest_id` e `invitation_id`;
- existência das policies e RLS nas tabelas sensíveis.

Os testes de mutação foram executados em transação com `ROLLBACK`, preservando o estado original do seed.

## Pendente de validação em ambiente de aplicação

O SQL Editor opera com privilégios elevados e não prova o comportamento real de uma sessão pública. Ainda devem ser testados:
- usuário `anon`;
- usuário autenticado ADMIN;
- usuário autenticado não-admin;
- comportamento de RLS por chamadas reais;
- upload e acesso ao Storage pela aplicação.

## Estágio 2 — Backend/API

Desenvolvimento do backend/API:
1. definir stack e estrutura;
2. configurar ambientes e cliente Supabase;
3. autenticação/autorização administrativa;
4. endpoints públicos por token;
5. módulos de eventos, convites, convidados e RSVP;
6. módulos de presentes e reservas;
7. galeria/Storage e conteúdo;
8. validação e tratamento padronizado de erros;
9. testes automatizados;
10. testes reais de RLS/autorização.

## Encerramento do Estágio 2 — Backend MVP v1

O backend/API do MVP foi implementado e validado em ambiente de aplicação, incluindo autenticação administrativa, RLS, acesso público por token, RSVP, eventos, convites, convidados, presentes, reservas, categorias, conteúdo público, galeria e Storage.

A suíte automatizada encontra-se com **42 testes passando**. Os fluxos administrativos, públicos e as principais regras de autorização/RLS também foram validados por chamadas reais.

Decisões consolidadas para o MVP v1:
- imagens da galeria e de presentes: limite de 5 MB;
- formatos de imagem suportados: JPEG, PNG e WebP;
- override administrativo de RSVP após o prazo: possível feature futura, não obrigatória no MVP atual;
- pagamentos permanecem fora do MVP.

Com os contratos principais do backend definidos e validados, o **Estágio 2 está oficialmente encerrado**.

## Situação geral do projeto

| Estágio | Escopo | Situação |
|---|---|---|
| Estágio 1 | Definição do produto, requisitos, regras de negócio, modelo de dados, Supabase e segurança inicial | **Encerrado** |
| Estágio 2 | Backend/API, autenticação, endpoints, RPCs, RLS, Storage e testes | **Encerrado** |
| Estágio 3 | Frontend público e administrativo, identidade visual e integração com a API | **Próximo** |
| Estágio 4 | Integração, homologação, ajustes finais, deploy e preparação para uso real | **Futuro** |

## Próximo estágio — Estágio 3

O Estágio 3 será dedicado ao desenvolvimento do frontend do **Love, Lopes & Caponi**.

A sequência prevista é:
1. definir a stack e a estrutura do frontend;
2. consolidar identidade visual, componentes-base e responsividade;
3. desenvolver a experiência pública e a navegação por convite;
4. implementar páginas de eventos, informações, história e galeria;
5. integrar RSVP individual;
6. integrar catálogo e reserva de presentes;
7. desenvolver autenticação e painel administrativo;
8. integrar gestão de eventos, convites, convidados, presentes, reservas, conteúdo e galeria;
9. implementar compartilhamento manual de convites/links;
10. validar os fluxos completos em desktop e mobile.

O frontend deverá consumir os contratos existentes da API. Alterações no backend durante o Estágio 3 devem ocorrer apenas quando uma necessidade concreta de integração ou correção for identificada, evitando expansão desnecessária do escopo.

## Features futuras registradas

Não são pendências do MVP atual:
- override administrativo de RSVP após o prazo;
- pagamentos integrados;
- demais evoluções que venham a ser validadas durante o desenvolvimento ou uso do produto.

**Marco atual:** Estágios 1 e 2 concluídos; projeto pronto para iniciar o Estágio 3 — Frontend.
