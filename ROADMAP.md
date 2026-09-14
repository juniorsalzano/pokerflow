# PokerFlow — Guia e Mapa do Projeto

Documento vivo. Atualize os status conforme o projeto avança. Serve como
referência rápida do fluxo de trabalho e como mapa das features do produto.

## Como funciona o Spec-Driven Development aqui

Toda feature (exceto typo/formatação) passa por esse fluxo, nesta ordem:

| # | Comando | O que gera | Descrição |
|---|---------|-----------|-----------|
| 1 | `/speckit-constitution` | `.specify/memory/constitution.md` | Regras fundamentais do produto (uma vez, ou quando mudar) |
| 2 | `/speckit-specify <descrição>` | `specs/NNN-slug/spec.md` | O quê e por quê da feature |
| 3 | `/speckit-clarify` *(opcional)* | atualiza o spec.md | Resolve ambiguidades com perguntas direcionadas |
| 4 | `/speckit-plan` | `plan.md` (+ research/data-model/contracts se precisar) | Como implementar |
| 5 | `/speckit-checklist` *(opcional)* | checklist da feature | Qualidade da spec/plano |
| 6 | `/speckit-tasks` | `tasks.md` | Lista de tarefas ordenadas por dependência |
| 7 | `/speckit-analyze` *(opcional)* | relatório | Checa consistência entre spec/plan/tasks |
| 8 | `/speckit-implement` | código | Executa as tarefas e escreve a aplicação |

Cada feature ganha sua própria pasta: `specs/NNN-nome-da-feature/`.

**Idioma**: specs, planos e tasks em **português (pt-BR)**. Código, nomes de
arquivos/variáveis e commits em **inglês**. (Regra fixada na constitution.)

**Regras de negócio do produto**: vivem em `.specify/memory/constitution.md`
(sigilo do voto, salas sem conta, YAGNI, etc.) — não duplicar aqui, só consultar lá.

## Setup do projeto

- [x] Constitution definida (`.specify/memory/constitution.md`, v1.1.0)
- [x] Regra de idioma pt-BR para artefatos
- [x] `CLAUDE.md` criado (contexto do projeto para o Claude Code)
- [x] Primeira feature especificada

## Mapa de features (backlog do produto)

Vá adicionando linhas conforme surgem ideias, e atualizando o status conforme
avança pelo fluxo acima.

| Feature | Status | Pasta |
|---------|--------|-------|
| Criar e entrar em uma sala (com escala de pontos) | Implementado (mock) | `specs/001-criar-entrar-sala/` |
| Rodada de votação (votar, revelar, resetar) | Implementado (mock) | `specs/002-rodada-votacao/` |
| Integração com backend real (my-api) | Implementado | `specs/003-integracao-backend-real/` |
| Chat na sala (ideia, ainda sem spec) | Não iniciado | — |

Status possíveis: `Não iniciado` → `Spec` → `Plan` → `Tasks` → `Implementado`.

## Notas / decisões ao longo do caminho

_(Registre aqui decisões importantes que não caibam em uma spec específica —
ex: mudanças de stack, adiamentos de escopo, etc.)_

- **2026-09-14**: Votar, revelar e resetar foram agrupados em uma única feature
  (`002-rodada-votacao`) em vez de 3 specs separadas, porque formam um único
  ciclo de estado da rodada (alinhado ao Princípio V da constitution). Reveal
  sem 100% dos votos é permitido; reatribuição de moderador ao sair da sala
  ficou fora de escopo, candidata a spec futura se necessário.
- **2026-09-14**: Canvas de design (logo, paleta, mockups das 3 telas) criado
  como referência visual para o `/speckit-plan`: tema escuro com roxo/degradê
  como padrão, toggle para tema claro, tipografia Space Grotesk + Manrope.
  Link: https://claude.ai/code/artifact/3b8854f3-4ca8-47b6-8dca-24a6f018325b
- **2026-09-14**: Estratégia de implementação definida como **frontend-first
  com mocks**: todo o frontend (criar sala, votar, revelar, resetar) será
  construído primeiro com dados/API mockados; as rotas reais do backend
  (Node.js + WebSocket) entram depois, substituindo os mocks sem reescrever
  os componentes. Detalhado em `CLAUDE.md`.
- **2026-09-14**: Alinhamento final antes de começar a implementar (3 decisões
  que viraram requisitos): (1) o mock simula múltiplos participantes
  sincronizando de fato entre abas do navegador (localStorage/BroadcastChannel),
  não com dados fake fixos; (2) identidade de moderador sobrevive a um refresh
  (F5) — adicionado como FR-010 na spec 001; (3) layout responsivo/mobile é
  obrigatório desde a v1 — adicionado como FR-011/SC-005 na spec 001 e
  SC-005 na spec 002.
- **2026-09-14**: Restrição de infraestrutura fixada na constitution (v1.2.0):
  API HTTP hospedada na Vercel, só recursos do plano free — nada de plano pago
  ou serviço de terceiros pago. Isso descarta WebSocket persistente (não
  suportado no free tier de funções serverless); o padrão passa a ser polling
  via HTTP, com o mecanismo exato decidido no `/speckit-plan`.
- **2026-09-14**: Novo princípio VI na constitution (v1.3.0): segurança por
  padrão (validar/sanitizar entrada, sem segredos no repo, rate limiting,
  dependências sem vulnerabilidades) + revisão de segurança (`security-review`)
  obrigatória antes de considerar qualquer feature concluída. "Preparo para
  crescer" é sobre arquitetura limpa, não sobre construir infraestrutura de
  escala antes da hora (continua valendo o YAGNI do Princípio I).
- **2026-09-15**: Feature 001 implementada (42/42 tarefas) — testes (18/18),
  build e lint limpos, `security-review` sem achados HIGH/MEDIUM. Risco aceito
  deliberadamente: 1 vulnerabilidade moderada dev-only (`@vitest/mocker`, path
  traversal só explorável rodando testes localmente) — o fix exige
  `vitest@5`, que travou o `npm install` neste ambiente por peer deps
  opcionais não usadas (Playwright/WebdriverIO/MSW); reavaliar quando
  estabilizar. Não validado automaticamente: sincronização real entre duas
  abas de navegador (precisa ser testado manualmente por um humano).
- **2026-09-15**: Bug real encontrado na validação manual — identidade de
  moderador vazava entre abas do mesmo navegador (usava localStorage,
  compartilhado entre abas; corrigido para sessionStorage). Corrigido via
  PR mesclado direto em main, com 5 testes novos provando que salas
  simultâneas (ex.: 5 devs numa sala, 7 em outra) são independentes.
  Commits passam a seguir Conventional Commits com descrição em português
  (constitution v1.4.0).
- **2026-09-15**: Nota adicionada ao Princípio II da constitution (v1.4.1):
  sigilo do voto é best-effort enquanto a fase mock estiver em vigor (sem
  servidor real guardando os votos) — decisão consciente, revisar quando a
  API real existir. Plan da spec 002 documenta essa ressalva.
- **2026-09-14**: Feature 002 implementada (36/36 tarefas) — testes (50/50),
  build limpo. `security-review` (feito a posteriori sobre o diff do commit
  `c5ed493`, já que a feature foi mesclada direto em main) sem achados
  HIGH/MEDIUM — sem `dangerouslySetInnerHTML`/`innerHTML`/`eval`, e código é
  100% client-side/mock nesta fase (sem backend para checar auth/injection
  ainda). Fecha o requisito do Princípio VI que ainda estava pendente para
  esta feature.
- **2026-09-14**: Feature 003 (`integracao-backend-real`) especificada —
  primeira feature que sai da fase mock. Decisão de arquitetura importante:
  o backend real NÃO nasce como pasta `api/` neste repositório; ele é
  implementado em `my-api`, um projeto NestJS já existente do autor (hoje
  serve o site de currículo, com Postgres via TypeORM), como um módulo
  isolado (ex.: `src/planning-poker/`), sem tocar nos módulos já existentes.
  O estado de sala/rodada/voto reaproveita esse Postgres já provisionado
  (exceção consciente ao "nenhum banco por padrão" do Princípio IV — não é
  infraestrutura nova, é reaproveitamento), com expiração automática mantendo
  o caráter efêmero do produto. O fluxo Spec Kit continua só neste
  repositório; `my-api` não ganha `.specify/` próprio. Registrado na
  constitution v1.5.0.
- **2026-09-14**: Feature 003 implementada (39/41 tarefas automatizáveis —
  os 2 pontos restantes, T029/T032, são validação manual com dispositivos/
  redes reais, ver abaixo). `/speckit-analyze` encontrou um achado **CRITICAL** antes da
  implementação começar: o desenho original de identidade usava só
  `participanteId` como "prova de posse", mas esse id é devolvido
  publicamente a todo participante da sala — qualquer um conseguiria ler o
  voto alheio antes do reveal ou agir como moderador só sabendo o
  `moderadorId` (também público), violando o Princípio II. Corrigido antes
  de qualquer código ser escrito: `participanteId` continua público
  (identifica/exibe), um novo `token` secreto (devolvido uma única vez ao
  dono) passa a ser exigido em toda ação e na leitura do próprio voto. Uma
  segunda rodada de `/speckit-analyze` (pedida explicitamente por já ter
  havido erro na primeira) não achou mais CRITICAL/HIGH, só uma
  inconsistência média (idempotência de `sairDaSala` no contrato), também
  corrigida antes de implementar.
  - Testes: 34 unit + 21 e2e (contra o Postgres real de produção do
    `my-api`, com limpeza automática das linhas de teste — confirmado 0
    linhas residuais) no backend; 59 (50 existentes + 9 novos) no frontend.
    Todos passando; build limpo nos dois repositórios.
  - Bugs reais encontrados e corrigidos durante a implementação (não pelo
    `/speckit-analyze`, pelos testes rodando de verdade): `votar`/`revelar`/
    `resetar` devolviam 201 em vez de 200 (faltava `@HttpCode`); a exclusão
    de sala expirada era desfeita pelo rollback da própria transação quando
    a ação em si também dava erro de negócio (ex.: sala expirada + token
    errado); `useCreateRoom` só tratava `ValidationError` (do mock) e não
    `RoomClientError "ENTRADA_INVALIDA"` (do backend real) para o mesmo
    caso de negócio.
  - `security-review` sem achados HIGH/MEDIUM nos dois repositórios.
  - Nota do Princípio II (constitution) atualizada: o sigilo do voto deixa
    de ser best-effort quando `VITE_API_BASE_URL` está configurada
    (constitution v1.5.1).
  - **Pendente de validação manual** (não automatizável, precisa de
    humano com dispositivos/redes reais — T029 e T032 de
    `specs/003-integracao-backend-real/tasks.md`): queda de conexão do
    moderador e reconexão dentro da janela de inatividade (US3); os 7
    passos do `quickstart.md` fim a fim, incluindo pelo menos dois
    dispositivos/redes diferentes de verdade (SC-001/SC-002). Até essa
    validação acontecer, a feature está "implementada e testada
    automaticamente", não "validada em uso real".
- **2026-09-14**: Segunda rodada de `code-review` (independente do
  `security-review` já feito) sobre o diff da feature 003, nos dois
  repositórios. Achados corrigidos: (1) `my-api` aceitava `nomeSala`/
  `nomeCriador`/`escalaPontos` sem nenhuma validação de tipo (não há
  `ValidationPipe` global no módulo) — um valor malformado crashava a rota
  com 500 em vez do `ENTRADA_INVALIDA`/400 documentado; (2) `projetarSala`
  no `my-api` não filtrava `rodada.votos` contra os participantes atuais —
  quem votava e saía da sala continuava contando como "votou" e tinha o
  voto exposto no reveal, furando o mesmo invariante que `resumoRodada` já
  garantia; (3) `sairDaSala` no `httpRoomClient` (pokerflow), chamado no
  `beforeunload` ao fechar a aba, não passava `keepalive: true` — o
  navegador tende a abortar esse fetch durante o descarregamento da
  página, tornando "sair da sala ao fechar a aba" um no-op silencioso
  contra o backend real. Testes novos: 2 unit + 1 e2e no `my-api` (22 e2e
  no total, todos passando contra o Postgres real); nenhum teste novo no
  frontend (mudança é um parâmetro de `fetch`, já coberto indiretamente).
  Dois achados dessa rodada foram deliberadamente **não** corrigidos por
  não serem bugs: reatribuição de moderador ao sair da sala já está fora
  de escopo por decisão registrada em `specs/002-rodada-votacao/spec.md`;
  token secreto como query string em `GET`/`DELETE` é o contrato já
  documentado em `api-contract.md` e coberto por 21 testes e2e — trocar
  para header é uma migração de contrato nos dois repositórios, não um fix
  pontual, e fica como candidata a uma rodada própria se o time decidir
  priorizar.
- **2026-09-14**: `httpRoomClient` passou a notificar a própria aba na hora
  com a `Sala` devolvida por `votar`/`revelar`/`resetar`, em vez de esperar
  o próximo polling (até 2s) — corrige o "efeito do voto" parecendo lento
  contra o backend real. 2 testes unit novos.
- **2026-09-14**: Bug real relatado em uso: fechar a aba e reabrir pelo link
  da sala fazia o app tratar o moderador/participante como alguém novo
  (virando um registro novo de verdade contra o backend real). Causa:
  `useModerator` usava `sessionStorage` de propósito (decisão de
  2026-09-15 anterior, para que uma segunda aba do mesmo navegador não
  fosse confundida com o mesmo participante durante testes manuais na fase
  mock). Revertido para `localStorage` — FR-010 (spec 001) ampliado para
  cobrir explicitamente "fechar a aba e reabrir pelo link", não só F5.
  Efeito colateral aceito: duas abas da mesma sala no mesmo navegador agora
  contam como a mesma pessoa (correto para uso real; testar múltiplos
  participantes localmente agora exige aba anônima/outro navegador). 60/60
  testes passando, build limpo.
- **2026-09-14**: O fix acima não bastou — bug ainda reproduzia. Causa real:
  `RoomPage` chamava `roomClient.sairDaSala` automaticamente no
  `beforeunload`, removendo o participante do servidor assim que a aba
  fechava; ao reabrir, a identidade local existia mas o servidor já não
  tinha mais aquele participante na sala. Esse comportamento vinha do
  cenário de aceite da US2 da spec 001 ("fecha a aba" = "sai"), que
  contradiz a US3 da spec 003 (reconectar dentro da janela de inatividade
  sem perder o papel de moderador) — a segunda já estava especificada e
  não implementada corretamente. Removida a chamada automática; sair da
  sala passa a acontecer só por ação explícita (ainda não implementada na
  UI) ou pela sala inteira expirar por inatividade. Specs 001 (cenário de
  aceite da US2) atualizada com nota explicando a mudança. Efeito colateral
  temporário: quem fecha a aba continua na lista de participantes até a
  sala expirar — será resolvido por um mecanismo de heartbeat de presença
  (candidato a spec futura, cross-repo com `my-api`). 60/60 testes
  passando, build e lint limpos.
- **2026-09-14**: Heartbeat de presença implementado (FR-010/FR-011,
  especificado via `/speckit-clarify` e planejado via `/speckit-plan` na
  mesma conversa, resolvendo o efeito colateral do item acima). Decisões
  fechadas com o usuário: janela de tolerância de 10 minutos sem sinal de
  presença antes de remover um participante; sinal enviado numa chamada
  separada do polling de leitura (`POST /rooms/:codigo/heartbeat`, a cada
  45s), não acoplada aos 2s de leitura, pra não multiplicar a escrita no
  Postgres; voto em andamento descartado junto da remoção. WebSocket foi
  considerado e descartado de novo nesta conversa — nem Vercel (funções
  serverless, sem processo persistente) nem Render free tier (hiberna após
  ~15min de inatividade) sustentam uma conexão persistente sem custo/infra
  nova; heartbeat continua sendo o compromisso dentro da restrição de
  custo zero.
  - Backend (`my-api`): `registrarPresenca`/`materializarAusentes` no
    domínio (funções puras); a "materialização" (remoção de ausentes) roda
    dentro de `withRoom` (com lock de linha), no mesmo ponto onde a
    expiração de sala já era checada — deliberadamente **não** roda na
    leitura sem lock (`ler`), pra não arriscar perder uma escrita
    concorrente; fica precisa o bastante porque qualquer heartbeat de quem
    ainda está na sala já dispara a poda. Cuidado explícito pra o
    heartbeat não renovar `ultimaAtividadeEm` da sala (isso faria uma aba
    esquecida aberta manter a sala viva pra sempre, contra o FR-005).
  - Frontend (`pokerflow`): hook `usePresenca` (novo), chamado de
    `RoomPage` enquanto a pessoa é participante da sala; falha isolada de
    heartbeat é ignorada (só o servidor decide remoção pela ausência
    repetida).
  - Testes: 13 novos no `my-api` (10 unit — `registrarPresenca`/
    `materializarAusentes` — + 3 e2e contra o Postgres real, todos
    passando; suíte completa do módulo `planning-poker` em 72 testes,
    unit+e2e) e 6 novos no `pokerflow` (2 em `httpRoomClient`, 4 em
    `usePresenca`; suíte completa em 66 testes). `security-review` sem
    achados HIGH/MEDIUM nos dois repositórios — o endpoint novo reaproveita
    a mesma checagem de `token` já revisada nas features anteriores.
  - **Pendente de validação manual** (T029/T029a de
    `specs/003-integracao-backend-real/tasks.md`, mesma natureza dos
    demais itens manuais desta feature): reconectar dentro da janela de 10
    minutos e confirmar que passado esse prazo a pessoa precisa entrar de
    novo — precisa de um humano rodando o app de verdade.
