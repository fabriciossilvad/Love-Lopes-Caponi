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

## Próxima fase — Estágio 2

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

O frontend será iniciado após os contratos principais do backend estarem definidos e validados.
