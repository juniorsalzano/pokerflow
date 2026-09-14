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
