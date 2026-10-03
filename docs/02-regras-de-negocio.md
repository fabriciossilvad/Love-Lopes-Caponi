# Regras de negócio — Estágio 1

Esta é a primeira versão oficial das regras de negócio consolidadas no Estágio 1.

## Eventos

**RN01.** O sistema deve suportar múltiplos eventos independentes.

**RN02.** Inicialmente existirão os contextos Casamento e Chá de Casa Nova, sem limitar a criação de outros eventos.

**RN03.** Cada evento possui data, informações de local, status e prazo próprio de RSVP.

**RN04.** Um convidado pode ser convidado para um ou mais eventos.

**RN05.** A participação em um evento é individual por convidado; pessoas do mesmo convite podem ter participações diferentes.

## Convites e convidados

**RN06.** Convite e convidado são entidades distintas.

**RN07.** Um convite pode conter uma ou várias pessoas.

**RN08.** Cada convidado pertence a exatamente um convite.

**RN09.** Cada convite possui um token público único, forte, aleatório e não sequencial.

**RN10.** IDs internos não devem ser usados como credencial pública na URL do convite.

**RN11.** O convidado não precisa possuir usuário/senha; o token identifica o escopo do convite.

**RN12.** Quem possuir o token poderá operar dentro do escopo daquele convite; por isso o token deve ser tratado como credencial.

**RN13.** Convites e convidados podem ser inativados sem remoção destrutiva do histórico.

## RSVP

**RN14.** O RSVP pertence à combinação única **Convidado + Evento**.

**RN15.** Os estados de RSVP são `PENDING`, `CONFIRMED` e `DECLINED`.

**RN16.** A resposta é individual: uma pessoa do convite não determina automaticamente a resposta das demais.

**RN17.** O convidado pode alterar o RSVP enquanto o prazo do evento estiver aberto.

**RN18.** Após o prazo, o convidado não pode alterar publicamente o RSVP.

**RN19.** Administradores podem corrigir/alterar RSVP mesmo após o prazo.

## Presentes e categorias

**RN20.** Presentes são vinculados a um evento específico.

**RN21.** Categorias de presentes são globais e podem ser reutilizadas entre eventos.

**RN22.** Um presente possui quantidade total maior que zero.

**RN23.** A quantidade disponível não deve ser armazenada de forma redundante; deve ser calculada a partir da quantidade total menos reservas ativas.

**RN24.** Presentes e categorias podem ser inativados sem exigir exclusão física.

## Reservas

**RN25.** Cada reserva ativa representa uma unidade de um presente.

**RN26.** Uma reserva pertence obrigatoriamente a um convite e pode, opcionalmente, indicar qual convidado daquele convite realizou a ação.

**RN27.** Se `guest_id` estiver preenchido na reserva, esse convidado deve pertencer ao mesmo convite da reserva.

**RN28.** Não pode ser criada nova reserva quando o número de reservas ativas alcançar a quantidade do presente.

**RN29.** A criação da reserva deve ser atômica no banco para evitar disputa pela última unidade disponível.

**RN30.** Cancelar uma reserva não a exclui; seu status passa de `ACTIVE` para `CANCELLED`, preservando histórico.

**RN31.** Administradores podem liberar/cancelar reservas.

**RN32.** Outros convidados não podem descobrir publicamente quem reservou determinado presente.

## Segurança, administração e evolução

**RN33.** Administradores são autenticados pelo Supabase Auth e somente registros ativos em `admin_users` com papel `ADMIN` recebem privilégios administrativos.

**RN34.** Reserva e pagamento são conceitos independentes. Uma futura integração deve poder evoluir para `GIFT → GIFT_RESERVATION → PAYMENT` sem alterar o significado da reserva.

## Decisões de segurança associadas

- Tabelas sensíveis de convidados, convites, RSVP e reservas não são expostas para leitura pública direta.
- Operações públicas sensíveis devem passar por funções/RPCs controladas ou pela futura API.
- Conteúdo público e catálogo podem possuir leitura pública filtrada por RLS.
- O primeiro administrador é criado por bootstrap no Supabase Auth e vinculado manualmente a `admin_users`.
