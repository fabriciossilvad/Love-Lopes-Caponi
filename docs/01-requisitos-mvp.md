# Requisitos do MVP — Estágio 1

## Objetivo

Construir um site de casamento moderno, responsivo e de baixa complexidade operacional para **Love, Lopes & Caponi**, com experiência pública para convidados e área administrativa para gestão pelos responsáveis.

O MVP atual **não processa pagamentos**. Presentes são selecionados/reservados; a arquitetura apenas preserva um caminho de evolução para pagamento integrado no futuro.

## Requisitos funcionais

### Site público
- Home e identidade visual do casamento.
- História do casal.
- Informações de cada evento.
- Data, local, endereço, mapa/link de localização e informações adicionais.
- Galeria de fotos.
- Experiência mobile-first.

### Eventos
- Suporte a múltiplos eventos.
- Eventos iniciais: **Casamento** e **Chá de Casa Nova**.
- Eventos são independentes e podem possuir convidados, prazo de RSVP e presentes diferentes.
- Um convidado pode participar de um ou vários eventos.

### Convites e convidados
- Convite e convidado são conceitos distintos.
- Um convite pode conter várias pessoas.
- Cada pessoa pertence a exatamente um convite.
- O acesso público ocorre por token forte e não sequencial.
- O convidado não precisa criar conta nem senha.
- Cada pessoa do convite pode possuir participação diferente por evento.

### RSVP
- RSVP individual por **Convidado + Evento**.
- Estados: `PENDING`, `CONFIRMED` e `DECLINED`.
- Prazo de resposta configurável por evento.
- Convidado pode alterar sua resposta enquanto estiver dentro do prazo.
- Após o prazo, alterações públicas são bloqueadas; administrador pode continuar alterando.

### Presentes
- Catálogo separado por evento.
- Presente possui nome, descrição, imagem, categoria, valor estimado opcional, quantidade, ordem e status.
- Quantidade pode ser maior que 1.
- Disponibilidade deve ser derivada das reservas ativas.
- Outros convidados visualizam disponibilidade, mas não a identidade de quem reservou.
- Reserva não implica pagamento.

### Administração
- Login administrativo.
- Gestão de eventos, convites, convidados e vínculos com eventos.
- Gestão/correção de RSVP.
- Gestão de categorias e presentes.
- Gestão de reservas, incluindo liberação/cancelamento.
- Gestão de galeria e conteúdo público.
- Filtro de convidados que ainda não responderam.
- Possibilidade de copiar/compartilhar link e mensagem de convite para envio manual por WhatsApp.

## Requisitos não funcionais
- Mobile-first e responsivo.
- HTTPS em produção.
- Otimização de imagens e desempenho.
- Princípio do menor privilégio.
- Dados pessoais mínimos e cuidados compatíveis com LGPD.
- Tokens públicos não previsíveis.
- Backups e possibilidade de restauração.
- Código e banco versionados.
- Manutenibilidade até o encerramento do projeto.
- Segredos e credenciais fora do Git.
- Operações críticas de reserva devem ser atômicas.

## Fora do MVP atual
- Pagamento integrado.
- Chat ou feed social.
- Aplicativo mobile nativo.
- API oficial do WhatsApp.
- Upload de arquivos por convidados.
- CMS complexo.
- Autocadastro de convidados.
