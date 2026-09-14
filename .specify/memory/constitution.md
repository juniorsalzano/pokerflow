<!--
Sync Impact Report
- Version change: 1.4.1 → 1.5.0
- Modified principles: none redefinidos; nota adicionada ao Princípio I
  reconhecendo a exceção de persistência abaixo.
- Modified sections: "Restrições Tecnológicas" — registra que o backend real
  (feature 003) passa a residir em um repositório já existente e separado
  (`my-api`, NestJS, fora do controle do Spec Kit deste projeto), como um
  módulo isolado dedicado ao PokerFlow, sem misturar com os módulos já
  existentes daquele projeto (auth/users/resume-log); e que a persistência
  reaproveita o Postgres já provisionado no `my-api` em vez de manter estado
  só em memória — desvio consciente da regra original de "nenhum banco de
  dados assumido por padrão", justificado por reaproveitar infraestrutura já
  paga/gratuita existente em vez de provisionar algo novo.
- Removed sections: none
- Follow-up TODOs: nenhum.
-->

# Constitution do PokerFlow

## Princípios Fundamentais

### I. Simplicidade Antes de Tudo (YAGNI)
O produto começa como uma ferramenta de Planning Poker de propósito único: criar
sala, entrar, votar, revelar. NÃO DEVE adicionar funcionalidades que não sejam
exigidas por uma spec aprovada (contas, persistência, integrações, analytics, etc.)
até que uma spec as justifique. Prefira o design mais simples que satisfaça a spec
atual em vez de generalidade especulativa.

**Justificativa**: É uma ferramenta pequena resolvendo uma fricção recorrente em
rituais de refinamento. Scope creep é o maior risco para o projeto nunca ser
lançado.

**Nota sobre persistência (feature 003)**: a integração com o backend real
reaproveita um banco Postgres que já existe e já está em uso por outro
projeto do mesmo autor (`my-api`), em vez de manter o estado da sala só em
memória. Isso não é scope creep do PokerFlow — nenhuma feature nova de
produto foi adicionada por causa disso — é uma escolha de infraestrutura que
reaproveita algo já provisionado em vez de criar algo novo. Ver "Restrições
Tecnológicas" e `specs/003-integracao-backend-real/`.

### II. Sigilo do Voto É Inegociável
O voto de um participante NÃO DEVE ser observável por nenhum outro participante
(inclusive via inspeção de rede de mensagens destinadas a outros clientes) até que
a ação de revelar da sala tenha sido acionada. O servidor NÃO DEVE transmitir
valores individuais de voto antes da revelação; PODE transmitir apenas o fato de
que um participante já votou.

**Justificativa**: Votação oculta até a revelação simultânea é todo o propósito do
planning poker — evita viés de ancoragem. Um vazamento, mesmo que parcial, anula o
propósito do produto.

**Nota sobre a fase mockada**: esta garantia é estrutural apenas quando um
servidor real guarda os votos e só os libera no reveal. Enquanto a estratégia
frontend-first com mock (ver CLAUDE.md) estiver em vigor, o sigilo é
best-effort — tecnicamente qualquer participante poderia inspecionar o
armazenamento local do próprio navegador e ver votos alheios antes da hora.
Essa limitação é aceita e documentada explicitamente enquanto não existir API
real (ver `specs/002-rodada-votacao/research.md`); o Princípio permanece
inegociável para a versão com backend real, que é quando a garantia passa a
ser de fato estrutural.

### III. Entrega Guiada por Spec
Nenhum código de aplicação é escrito sem uma spec aprovada para aquela
funcionalidade (`/speckit-specify`), e nenhuma spec avança para implementação sem
um plano (`/speckit-plan`) e um detalhamento de tarefas (`/speckit-tasks`). Toda
branch de feature remete a um arquivo de spec em `specs/`.

**Justificativa**: O projeto adota explicitamente o desenvolvimento guiado por
spec para manter escopo, decisões de design e justificativas documentados e
revisáveis antes de o código existir.

### IV. Salas Efêmeras e de Baixa Fricção
Entrar em uma sala NÃO DEVE exigir nada além de um nome e um link/código de sala —
sem criação de conta, sem senha, sem e-mail, para a v1. O estado da sala
(participantes, votos) é vinculado à sessão e PODE ser descartado quando a sala
ficar inativa; não é um sistema de registro. Qualquer exigência de histórico
persistente, contas ou autenticação DEVE vir de uma spec futura explícita, e não
ser assumida.

**Justificativa**: Sessões de planning poker são rituais de equipe de curta
duração; fricção para entrar prejudica diretamente a adoção pelo time.

### V. Lógica Core Testável (NÃO NEGOCIÁVEL)
As transições de estado de sala/sessão (entrar, sair, votar, revelar, resetar)
DEVEM ser implementadas como lógica testável por unidade, independente do
transporte (HTTP/WebSocket) ou da UI, e DEVEM ter testes automatizados cobrindo: o
invariante de voto oculto, a corretude da revelação e o comportamento de reset
para a próxima rodada. As camadas de UI e transporte são exercitadas manualmente
ou com testes mais leves; a máquina de estados de votação é a única parte do
sistema que NÃO PODE regredir silenciosamente.

**Justificativa**: A máquina de estados (oculto → revelado → reset) é o valor
central do produto e sua fonte mais provável de bugs sutis (ex.: um voto vazando
antes da hora).

### VI. Segurança por Padrão e Preparo para Crescer (NÃO NEGOCIÁVEL)
Toda superfície exposta publicamente (endpoints HTTP, formulários, links de
sala, código de sala) DEVE seguir práticas básicas de segurança: validar e
sanitizar toda entrada do usuário (nome de sala, nome de participante, valor
de voto) contra XSS e injeção; nunca commitar segredos, chaves ou tokens no
repositório (usar variáveis de ambiente, com um `.env.example` documentando
quais existem, sem valores reais); aplicar limite de taxa (rate limiting)
básico nos endpoints públicos — tanto por segurança quanto para não estourar
o teto do plano gratuito (ver Restrições Tecnológicas); manter dependências
sem vulnerabilidades conhecidas (auditoria antes de cada release). Toda
feature implementada DEVE passar por uma revisão de segurança
(`security-review`) antes de ser considerada concluída.

"Preparo para crescer" NÃO significa construir infraestrutura de escala antes
da hora (isso violaria o Princípio I) — significa apenas evitar decisões que
exijam reescrita completa se o uso crescer (ex.: manter a lógica de domínio
isolada da camada de transporte/dados, como já exige o Princípio V), para que
adicionar capacidade real no futuro seja incremental, não uma refundação.

**Justificativa**: É uma ferramenta pública, de código aberto e sem
autenticação — a superfície de ataque mais óbvia é entrada de usuário não
validada e abuso de endpoints gratuitos. Ser "simples" (Princípio I) não é
desculpa para pular higiene básica de segurança; e não pensar em arquitetura
limpa desde o início custa caro depois, mesmo sem construir escala agora.

## Restrições Tecnológicas

Aplicação web: React + Vite no frontend, Node.js no backend. A API DEVE ser
uma API HTTP hospedada na **Vercel**, usando exclusivamente recursos do
**plano gratuito** (Hobby) — nenhuma escolha técnica pode depender de plano
pago, serviço de terceiros pago, ou recurso que extrapole os limites do free
tier. Isso é uma restrição de negócio (custo zero de infraestrutura), não um
detalhe de implementação, e vale para toda decisão técnica futura.

Consequência direta: funções serverless da Vercel não mantêm conexão
persistente (sem WebSocket de verdade no plano gratuito). A sincronização de
estado da sala em tempo real DEVE ser resolvida dentro desse limite — por
padrão, o frontend consulta a API HTTP em intervalos curtos (polling), sem
infraestrutura adicional. Um serviço de real-time de terceiros só pode entrar
se comprovadamente necessário E permanecer 100% dentro do seu free tier; a
decisão exata do mecanismo (frequência de polling, ou alternativa) é tomada em
`/speckit-plan`, mas sempre dentro desta restrição.

A infraestrutura DEVE permanecer mínima para a v1: nenhum banco de dados novo
é assumido por padrão; adicionar um apenas quando uma spec exigir persistência
além do ciclo de vida de uma sala ativa, e mesmo assim dentro de uma opção
gratuita **ou já provisionada** (ver exceção abaixo). Hospedagem do frontend
também deve seguir a mesma restrição de custo zero.

### Backend real: repositório `my-api` (decisão da feature 003)

O backend HTTP do PokerFlow NÃO é implementado como pasta `api/` dentro deste
repositório. Ele reside em `my-api`, um projeto NestJS já existente e já
implantado na Vercel (Hobby), usado por outro produto do mesmo autor
(currículo/site pessoal — módulos `auth`, `users`, `resume-log`). Decisões
que isso implica, válidas para toda spec de backend a partir da 003:

- O fluxo Spec Kit (`/speckit-*`) continua rodando **apenas neste
  repositório** (pokerflow). `my-api` não ganha sua própria pasta
  `.specify/` — spec/plan/tasks aqui descrevem o contrato e o comportamento
  esperado da API; a implementação de fato é escrita em `my-api` seguindo
  esse plano, respeitando as convenções já existentes daquele projeto
  (NestJS, Jest, ESLint/Prettier próprios) em vez das deste repositório.
- O código do PokerFlow DEVE viver em um módulo NestJS isolado dentro de
  `my-api` (ex.: `src/planning-poker/`), sem alterar os módulos existentes
  (`auth`, `users`, `resume-log`) — minimiza o risco de regressão no produto
  que já está em produção ali.
- `my-api` já tem um Postgres provisionado (via TypeORM) para o site de
  currículo. **Exceção consciente** à regra de "nenhum banco novo por
  padrão": o estado de sala/rodada/voto do PokerFlow reaproveita esse mesmo
  banco (tabelas próprias, isoladas por nome/schema do restante do projeto),
  em vez de manter tudo em memória do processo serverless — que não
  sobrevive de forma confiável entre invocações/instâncias diferentes na
  Vercel. Isso não é uma nova despesa de infraestrutura (o banco já existe e
  já está pago/gratuito para o outro produto); é reaproveitamento, não
  scope creep. O estado continua efêmero do ponto de vista do produto: linhas
  de sala/rodada/voto expiram e são descartadas após o período de inatividade
  (Princípio IV) — não viram histórico permanente nem relatório.

**Justificativa**: reescrever do zero um segundo backend/infra quando já
existe um projeto Node.js do próprio autor, hospedado no mesmo provedor
gratuito e com banco já provisionado, seria exatamente o tipo de esforço
redundante que o Princípio I (YAGNI) pede para evitar. A contrapartida é
isolamento de código e de dados dentro de `my-api`, para não colocar em risco
o produto que já roda lá.

## Fluxo de Trabalho

As features passam pelo ciclo de vida do Spec Kit neste projeto:
`/speckit-constitution` (este documento) → `/speckit-specify` → opcionalmente
`/speckit-clarify` → `/speckit-plan` → opcionalmente `/speckit-checklist` →
`/speckit-tasks` → opcionalmente `/speckit-analyze` → `/speckit-implement` →
revisão de segurança (`security-review`, ver Princípio VI) antes de considerar
a feature concluída. Cada feature ganha seu próprio diretório
`specs/<NNN>-<slug>/` produzido pela ferramenta. Pular as etapas de
specify/plan/tasks e ir direto para a implementação só é aceitável para
mudanças triviais e não-funcionais (erros de digitação, formatação) que não
tocam em comportamento coberto pelos Princípios Fundamentais acima.

### Idioma da Documentação

Todos os artefatos do Spec Kit (`spec.md`, `plan.md`, `tasks.md`, checklists,
perguntas e respostas de clarificação, e esta constitution) DEVEM ser escritos em
português do Brasil (pt-BR). Código, identificadores (variáveis, funções,
arquivos) e comentários inline no código permanecem em inglês, seguindo a
convenção padrão de engenharia. Quando um termo não tiver equivalente natural
em português (ex.: jargão técnico já estabelecido), mantenha o termo em inglês.

**Mensagens de commit** seguem o padrão **Conventional Commits** — prefixo em
inglês (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`,
`ci`, `build`), dois-pontos, e a descrição em português do Brasil. Exemplo:
`fix: corrige identidade de moderador vazando entre abas`.

**Justificativa**: O time se comunica em português; escrever specs, planos e
commits em português mantém a revisão acessível a todos os stakeholders sem
fricção de tradução, enquanto código e o prefixo do commit (convenção de
ferramentas/ecossistema) permanecem em inglês.

## Governança

Esta constitution substitui a prática ad-hoc neste projeto. Emendas são feitas
editando este arquivo via `/speckit-constitution`, devem declarar a justificativa
do bump de versão (MAJOR: remoção/redefinição incompatível de princípio; MINOR:
novo princípio ou orientação materialmente expandida; PATCH: esclarecimento/
redação), e entram em vigor imediatamente para novos trabalhos. Specs em
andamento não são invalidadas retroativamente, mas DEVEM ser revisadas em relação
à emenda antes da próxima etapa de planejamento. Qualquer plano ou lista de
tarefas que conflite com um Princípio Fundamental DEVE ser revisado antes de a
implementação prosseguir.

**Versão**: 1.5.0 | **Ratificada em**: 2026-09-12 | **Última Emenda**: 2026-09-14
