---

description: "Task list for feature 004 — Painel Central da Mesa e Revelação de Resultado com Transições"
---

# Tasks: Painel Central da Mesa e Revelação de Resultado com Transições

**Input**: Design documents from `/specs/004-revelacao-resultado/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Incluídas apenas para a lógica pura (máquina de fases, agrupamento por valor, iniciais/avatar, decisão de confete) — conforme decidido em plan.md/quickstart.md. Transições visuais, CSS e a chamada real de `canvas-confetti` são validadas manualmente via quickstart.md (Princípio V da constitution: só a lógica core precisa de cobertura automatizada; a camada de UI é exercitada manualmente).

**Organization**: Tarefas agrupadas por história de usuário (spec.md), para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual história de usuário a tarefa pertence (US1–US5)

## Path Conventions

Projeto frontend único (React + Vite), conforme `plan.md` → Project Structure:
`src/components/`, `src/pages/`, `src/hooks/`, `src/services/`, `src/types/`, testes em `tests/unit/` (convenção já usada no projeto, ex. `tests/unit/roomStore.resumoRodada.test.ts`).

---

## Phase 1: Setup

**Purpose**: Preparar a única dependência nova da feature (research.md §1)

- [X] T001 [P] Instalar `canvas-confetti` e `@types/canvas-confetti` (`npm install canvas-confetti && npm install -D @types/canvas-confetti`), atualizando `package.json`/`package-lock.json`

**Checkpoint**: Dependência disponível para uso em qualquer história.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Máquina de fases de apresentação e o esqueleto do painel central — pré-requisito bloqueante para US1–US4 (US5 depende apenas de US3 estar completa)

**⚠️ CRITICAL**: Nenhuma história pode ser implementada de forma independente antes desta fase estar completa

- [X] T002 Implementar o tipo `FaseRevelacao` e o hook `useRevelacaoTransicao` em `src/hooks/useRevelacaoTransicao.ts` — máquina de fases completa `"votando" → "contagem" → "virando" → "resultado"` e `"resultado" → "voltando" → "votando"`, reagindo a `sala.rodada.estado`, com temporizadores locais entre fases e a regra "reset a qualquer momento força a fase para `voltando`" (data-model.md tabela de transições; FR-002, FR-004, FR-013, FR-014)
- [X] T003 Teste unitário completo do hook em `tests/unit/useRevelacaoTransicao.test.ts` — cobre cada transição da tabela de data-model.md, incluindo reset disparado durante qualquer fase intermediária (FR-014) e a guarda de sigilo do voto (nenhuma fase antes de `resultado` expõe `rodada.votos` de outro participante)
- [X] T004 [P] Criar o esqueleto do componente `MesaPainel` em `src/components/MesaPainel/MesaPainel.tsx` e `src/components/MesaPainel/MesaPainel.module.css` — recebe a fase atual (via `useRevelacaoTransicao`) e um `switch`/render condicional por fase, com os casos "contagem" e "resultado" vazios por enquanto (preenchidos nas Histórias 2 e 3)
- [X] T005 Integrar `useRevelacaoTransicao` e `MesaPainel` em `src/pages/RoomPage.tsx`, renderizando o painel acima da grade de assentos (`styles.assentos`) — sem remover nada do fluxo existente de voto/revelação/reset (spec 002)

**Checkpoint**: Fundação pronta — cada história de usuário pode ser implementada e testada de forma independente a partir daqui.

---

## Phase 3: User Story 1 - Painel central da mesa como status da rodada (Priority: P1) 🎯 MVP

**Goal**: O painel central existe acima da grade de participantes e mostra uma mensagem de status simples durante a votação (spec.md História 1, FR-001/FR-002/FR-015)

**Independent Test**: Abrir uma sala com uma rodada em andamento e conferir que o painel central aparece acima da grade, mostrando uma mensagem de status; conferir em largura mobile que ambos permanecem legíveis.

### Implementation for User Story 1

- [X] T006 [US1] Implementar o caso de fase "votando" do `MesaPainel`: mensagem de status simples (ex.: instrução para votar), sem mascote/emoji, em `src/components/MesaPainel/MesaPainel.tsx`
- [X] T007 [P] [US1] Estilizar o `MesaPainel` com a paleta de cores e tipografia já definidas do PokerFlow (`MesaPainel.module.css`), incluindo breakpoint mobile equivalente aos já usados em `RoomPage.module.css` (FR-010, FR-015)
- [X] T008 [P] [US1] Ajustar `src/pages/RoomPage.module.css` para o espaço do painel central acima da grade de assentos (`styles.body`/`styles.assentos`), sem quebrar o layout responsivo existente

**Checkpoint**: Neste ponto, a História 1 deve estar totalmente funcional e testável de forma independente (painel central visível com status, em qualquer largura de tela).

---

## Phase 4: User Story 2 - Revelar com contador no painel central (Priority: P1)

**Goal**: Ao revelar, uma contagem regressiva (3, 2, 1) aparece no painel central antes do flip; cartas ocultas mostram textura de verso de carta (spec.md História 2, FR-003/FR-004/FR-005)

**Independent Test**: Registrar votos, clicar em "Revelar" e conferir que a contagem aparece no painel central antes de qualquer carta virar, e que as cartas só viram depois que a contagem termina; conferir que cartas ocultas mostram textura de verso, não área lisa.

### Implementation for User Story 2

- [X] T009 [US2] Implementar o caso de fase "contagem" do `MesaPainel`: exibir os números 3, 2, 1 em sequência (usando o valor de contagem exposto por `useRevelacaoTransicao`) em `src/components/MesaPainel/MesaPainel.tsx`
- [X] T010 [P] [US2] Estilizar a exibição do número da contagem no `MesaPainel.module.css` (entrada/saída de cada número, paleta do PokerFlow, sem mascote/emoji)
- [X] T011 [P] [US2] Adicionar textura de verso de carta ao estado `.oculto` do `SeatCard` em `src/components/SeatCard/SeatCard.module.css` (padrão visual, não lisa/vazia — FR-003)
- [X] T012 [US2] Em `src/pages/RoomPage.tsx`, garantir que o flip individual das cartas (`SeatCard` `revelado`) só ocorre quando a fase chega em "virando" (não diretamente em `sala.rodada.estado === "revelada"` como hoje) — mantém o comportamento de flip já existente (spec 002), só reordenado no tempo

**Checkpoint**: Neste ponto, as Histórias 1 e 2 devem funcionar juntas de forma independente — painel de status, contador antes do flip, e cartas com verso realista.

---

## Phase 5: User Story 3 - Resultado agrupado substitui as cartas reveladas (Priority: P2)

**Goal**: Pouco depois do flip, as cartas se transformam num painel de resultado que agrupa os participantes por valor votado, com avatares de iniciais (spec.md História 3, FR-006/FR-007/FR-011/FR-012)

**Independent Test**: Revelar uma rodada com votos divergentes e conferir que, após o flip, as cartas se transformam no painel agrupado por valor, com os avatares corretos em cada grupo; testar também os casos "ninguém votou" (estado vazio) e "alguns não votaram" (indicação textual).

### Implementation for User Story 3

- [X] T013 [P] [US3] Implementar `agruparPorValor(sala: Sala): DistribuicaoResultado` em `src/services/mock/roomStore.ts`, reaproveitando a mesma fonte de dados de `resumoRodada` (`sala.rodada.votos`, `sala.participantes`) — um grupo por valor distinto votado, participantes sem voto em `naoVotaram`, nenhum grupo vazio criado (data-model.md §DistribuicaoResultado; FR-007, FR-011, FR-012)
- [X] T014 [US3] Teste unitário de `agruparPorValor` em `tests/unit/roomStore.agruparPorValor.test.ts` — agrupamento correto por valor (incluindo escalas não numéricas), participantes sem voto excluídos dos grupos, caso "ninguém votou" retorna `grupos: []`
- [X] T015 [P] [US3] Implementar `iniciais(nome: string): string` e `avatarDe(participante: Participante): AvatarParticipante` (cor determinística dentro da paleta já existente do PokerFlow) em novo arquivo `src/services/avatar.ts` (research.md §5)
- [X] T016 [US3] Teste unitário de `iniciais`/`avatarDe` em `tests/unit/avatar.test.ts` — determinismo (mesmo participante sempre produz o mesmo avatar), formato das iniciais, cor sempre dentro dos tokens de paleta existentes
- [X] T017 [P] [US3] Criar o componente `Avatar` (círculo com iniciais + cor) em `src/components/Avatar/Avatar.tsx` e `src/components/Avatar/Avatar.module.css`, consumindo `avatarDe`
- [X] T018 [US3] Criar o componente `ResultadoAgrupado` em `src/components/ResultadoAgrupado/ResultadoAgrupado.tsx` e `.module.css` — recebe `DistribuicaoResultado`, renderiza um grupo por valor com os `Avatar`s empilhados, mensagem de estado vazio quando `grupos.length === 0` (FR-011), e indicação textual de quantos participantes não votaram (FR-012)
- [X] T019 [US3] Em `src/pages/RoomPage.tsx`, renderizar `ResultadoAgrupado` (via `agruparPorValor(sala)`) no lugar da grade de assentos quando a fase chegar em "resultado"
- [X] T020 [P] [US3] Estilizar a transição carta a carta entre as cartas reveladas (`SeatCard`) e o `ResultadoAgrupado` — transformação escalonada por índice, no mesmo espírito do `transitionDelay` já usado no flip do `SeatCard` (spec 002) — em `RoomPage.module.css`/`ResultadoAgrupado.module.css` (FR-006)

**Checkpoint**: Neste ponto, as Histórias 1, 2 e 3 devem funcionar juntas de forma independente — fluxo completo até o resultado agrupado, sem confete e sem reset ainda.

---

## Phase 6: User Story 4 - Voltar para uma nova rodada com transição (Priority: P2)

**Goal**: Ao resetar, o painel de resultado transiciona de volta para cartas individuais na grade, e o painel central volta ao status de votação (spec.md História 4, FR-013/FR-014)

**Independent Test**: Com o painel de resultado visível, clicar em "Resetar" e conferir que ele transiciona de volta para cartas individuais nas posições da grade, o painel central volta a mostrar o status, e uma nova rodada pode começar sem recarregar a página. Testar também resetar durante uma transição em andamento (contagem, flip ou transformação para o resultado).

### Implementation for User Story 4

- [X] T021 [US4] Em `src/components/MesaPainel/MesaPainel.tsx`, implementar o caso de fase "voltando" (painel de resultado saindo de cena — reaproveita a mesma transição de saída usada na transformação cartas→resultado de T020, em ordem reversa) e, em `src/pages/RoomPage.tsx`, ligar a sequência "voltando"→"votando" (já implementada em `useRevelacaoTransicao`, T002) à re-renderização da grade de assentos e do `MesaPainel` de volta ao caso "votando" — confirma que o reset (`sala.rodada.estado` voltando para `"votando"`) propaga corretamente pela UI a qualquer momento (FR-013, FR-014)
- [X] T022 [P] [US4] Estilizar a animação de entrada das cartas voltando à grade (efeito "de baixo para cima", escalonado por índice) em `src/components/SeatCard/SeatCard.module.css`/`src/pages/RoomPage.module.css`

**Checkpoint**: Neste ponto, as Histórias 1–4 devem funcionar juntas de forma independente — ciclo completo votar → revelar → resultado → resetar, sem confete ainda.

---

## Phase 7: User Story 5 - Celebrar o consenso com confete (Priority: P3)

**Goal**: Em consenso total, um burst de confete curto aparece no mesmo instante em que o painel de resultado agrupado aparece (spec.md História 5, FR-008/FR-009)

**Independent Test**: Fazer todos os participantes votarem o mesmo valor e revelar — o confete deve aparecer junto com o painel de resultado e desaparecer sozinho. Repetir com votos divergentes e confirmar que nenhum confete aparece.

### Implementation for User Story 5

- [X] T023 [P] [US5] Criar `src/services/confetti.ts` com `deveExibirConfete(resumo: ResumoRodada): boolean` (true somente quando `resumo.resultado.tipo === "consenso"`) e `dispararConfete(): Promise<void>` (import dinâmico de `canvas-confetti`, burst curto com cores da paleta do PokerFlow — research.md §1, FR-008)
- [X] T024 [US5] Teste unitário de `deveExibirConfete` em `tests/unit/confetti.test.ts` — `true` só em consenso total; `false` em dispersão e em "sem-consenso"/zero votos (FR-009)
- [X] T025 [US5] Em `src/pages/RoomPage.tsx`, chamar `dispararConfete()` ao entrar na fase "resultado" quando `deveExibirConfete(resumoRodada(sala))` for verdadeiro

**Checkpoint**: Todas as histórias de usuário completas e funcionando juntas.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e higiene antes de considerar a feature concluída

- [X] T026 [P] Revisão de responsividade mobile do fluxo completo (painel central, contador, grade, resultado) nos breakpoints já usados em `RoomPage.module.css`, `MesaPainel.module.css`, `ResultadoAgrupado.module.css` (SC-004)
- [X] T027 [P] Executar manualmente os 7 cenários de [quickstart.md](./quickstart.md) (duas abas do navegador) e registrar o resultado — validado em 2026-09-15, todos os cenários (1–6) passaram sem desvios
- [X] T028 Rodar `security-review` sobre o diff da feature (Princípio VI da constitution) antes de considerar a feature concluída
- [X] T029 Rodar a suíte completa — `npm run test`, `npm run lint`, `npm run build` — garantindo zero regressão nas specs 001–003, incluindo os testes já existentes que cobrem FR-016 (apenas o moderador aciona Revelar/Resetar — regra não alterada por esta feature)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende do Setup — BLOQUEIA todas as histórias
- **User Stories (Phase 3–7)**: todas dependem da Fase 2 completa
  - US1 (P1) e US2 (P1) podem ser feitas em sequência ou em paralelo por pessoas diferentes (tocam `MesaPainel` em casos de fase diferentes, mas o mesmo arquivo — coordenar se paralelo)
  - US3 (P2) depende visualmente de US2 estar completa (transforma as cartas já reveladas), mas sua lógica pura (T013–T017) pode começar em paralelo com US1/US2
  - US4 (P2) depende de US3 estar completa (reverte a transição que US3 cria)
  - US5 (P3) depende de US3 estar completa (o gatilho é a fase "resultado" aparecendo)
- **Polish (Phase 8)**: depende de todas as histórias desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: depende só da Fundação (Phase 2)
- **US2 (P1)**: depende só da Fundação — visualmente se apoia em US1 (mesmo componente `MesaPainel`), mas é testável de forma independente (contador aparece mesmo que a mensagem de status de US1 seja um placeholder)
- **US3 (P2)**: depende da Fundação; sua parte visual pressupõe o flip de US2 já ocorrendo
- **US4 (P2)**: depende da Fundação e da transição de US3 existir (é a transição reversa dela)
- **US5 (P3)**: depende da Fundação e de US3 (gatilho é o painel de resultado aparecer)

### Within Each User Story

- Lógica pura (funções, hook) antes de componentes de UI
- Componentes de UI antes da integração em `RoomPage.tsx`
- Estilos (`[P]`) podem ser feitos em paralelo com a lógica, desde que a estrutura HTML/props já exista

### Parallel Opportunities

- T001 (setup) é o único da Fase 1, já `[P]` por natureza
- Na Fundação: T004 (esqueleto do `MesaPainel`) pode rodar em paralelo com T002/T003 (hook), desde que o contrato de props (`fase`) seja combinado antes
- Dentro de cada história, tarefas de CSS marcadas `[P]` podem rodar em paralelo com a lógica correspondente
- US1 e US2 tocam o mesmo arquivo (`MesaPainel.tsx`) em casos de fase diferentes — coordenar se feitas por pessoas diferentes ao mesmo tempo
- A lógica pura de US3 (T013–T017, `roomStore.ts`, `avatar.ts`, `Avatar`) pode ser adiantada em paralelo com US1/US2, já que não depende delas

---

## Parallel Example: User Story 3

```bash
# Lógica pura pode ser feita em paralelo (arquivos diferentes):
Task: "Implementar agruparPorValor em src/services/mock/roomStore.ts"
Task: "Implementar iniciais/avatarDe em src/services/avatar.ts"

# Depois de avatarDe existir, o componente Avatar pode ser construído em paralelo
# com a finalização de agruparPorValor:
Task: "Criar componente Avatar em src/components/Avatar/Avatar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (CRITICAL — bloqueia todas as histórias)
3. Completar Fase 3: US1 (painel central com status)
4. Completar Fase 4: US2 (contador + verso de carta)
5. **PARAR e VALIDAR**: já é uma melhoria perceptível e completa sozinha (painel central + contador + verso de carta realista), mesmo sem resultado agrupado, confete ou transição de reset

### Incremental Delivery

1. Setup + Fundação → base pronta
2. US1 → painel de status visível → valida sozinho
3. US2 → contador + verso de carta → valida sozinho (MVP da feature)
4. US3 → resultado agrupado por valor → valida sozinho
5. US4 → transição de volta no reset → fecha o ciclo visual
6. US5 → confete no consenso → toque final de celebração
7. Cada história agrega valor sem quebrar as anteriores

---

## Notes

- `[P]` = arquivos diferentes, sem dependência de tarefa incompleta
- `[Story]` mapeia a tarefa para rastreabilidade com spec.md
- Testes cobrem só a lógica pura (hook de fases, agrupamento, avatar, decisão de confete) — consistente com o Princípio V da constitution (só a máquina de estados core exige cobertura automatizada) e com quickstart.md (transições visuais e confete real são validados manualmente)
- Fazer commit após cada tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a história isoladamente
- Evitar: tarefas vagas, conflito no mesmo arquivo entre tarefas paralelas, dependências entre histórias que quebrem a independência
