<!--
Sync Impact Report
- Version change: 1.2.0 → 1.3.0
- Modified principles: n/a
- Added principles: VI. Segurança por Padrão e Preparo para Crescer (NÃO
  NEGOCIÁVEL) — higiene básica de segurança em toda superfície pública,
  revisão de segurança obrigatória antes de considerar uma feature concluída,
  e arquitetura limpa (sem construir escala prematura, ver Princípio I).
- Modified sections: Fluxo de Trabalho — adiciona `security-review` como
  etapa final do ciclo de vida de cada feature.
- Removed sections: none
- Follow-up TODOs: none
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

### II. Sigilo do Voto É Inegociável
O voto de um participante NÃO DEVE ser observável por nenhum outro participante
(inclusive via inspeção de rede de mensagens destinadas a outros clientes) até que
a ação de revelar da sala tenha sido acionada. O servidor NÃO DEVE transmitir
valores individuais de voto antes da revelação; PODE transmitir apenas o fato de
que um participante já votou.

**Justificativa**: Votação oculta até a revelação simultânea é todo o propósito do
planning poker — evita viés de ancoragem. Um vazamento, mesmo que parcial, anula o
propósito do produto.

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

A infraestrutura DEVE permanecer mínima para a v1 (nenhum banco de dados é
assumido por padrão; adicionar um apenas quando uma spec exigir persistência
além do ciclo de vida de uma sala ativa, e mesmo assim dentro de uma opção
gratuita). Hospedagem do frontend também deve seguir a mesma restrição de
custo zero (ex.: Vercel free tier serve tanto o frontend quanto a API).

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
arquivos, mensagens de commit) e comentários inline no código permanecem em
inglês, seguindo a convenção padrão de engenharia. Quando um termo não tiver
equivalente natural em português (ex.: jargão técnico já estabelecido), mantenha
o termo em inglês.

**Justificativa**: O time se comunica em português; escrever specs e planos em
português mantém a revisão acessível a todos os stakeholders sem fricção de
tradução, enquanto o código permanece em inglês para seguir as convenções do
ecossistema/ferramentas.

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

**Versão**: 1.3.0 | **Ratificada em**: 2026-09-12 | **Última Emenda**: 2026-09-14
