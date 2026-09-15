# Implementation Plan: Painel Central da Mesa e Revelação de Resultado com Transições

**Branch**: `004-revelacao-resultado` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-revelacao-resultado/spec.md`

## Summary

Adiciona um painel central ("a mesa") acima da grade de participantes já
existente na tela da sala, que troca de conteúdo conforme a fase da rodada:
mensagem de status durante a votação → contagem regressiva (3, 2, 1) ao
revelar → painel de resultado agrupando participantes por valor votado
(avatares com iniciais). O flip individual das cartas (já existente, spec 002)
passa a ser antecedido pelo contador e seguido por uma transição que
transforma as cartas reveladas no painel de resultado. Consenso total dispara
um burst de confete curto. Resetar reverte as transições e volta o painel
central ao status de votação. É uma feature puramente de apresentação
(frontend): não introduz estado novo no servidor nem muda a máquina de
estados da rodada (votar/revelar/resetar) já coberta pela spec 002 — apenas
consome os dados já existentes (`Sala.rodada`, `resumoRodada`) para decidir o
que renderizar e quando animar.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18.3, projeto já existente)

**Primary Dependencies**: React 18, react-router-dom 7 (já em uso). Novo:
`canvas-confetti` (biblioteca de confete pronta, ~3kb gzip, zero
dependências) para o burst de confete da História 5 — ver
[research.md](./research.md) §1. Nenhuma biblioteca de animação/transição
nova (ex.: Framer Motion) — as transições usam CSS (transitions/keyframes)
orquestradas por estado React, seguindo o padrão já usado em `SeatCard` (flip
3D com `transitionDelay` escalonado) — ver research.md §2.

**Storage**: N/A para esta feature — não adiciona nem muda persistência.
Consome `Sala`/`Rodada`/`resumoRodada` já existentes (mock local ou API real
via `my-api`, spec 003, conforme `VITE_API_BASE_URL`).

**Testing**: Vitest + Testing Library (já em uso no projeto). Testes unitários
para as quatro áreas de lógica pura desta feature: a máquina de fases
(`useRevelacaoTransicao`), a função de agrupamento por valor votado
(`agruparPorValor`), a função de iniciais/cor de avatar (`avatarDe`) e a
decisão de disparar confete (`deveExibirConfete`). Transições CSS e o burst
real de confete (`canvas-confetti`) são verificados manualmente (não são
lógica core segundo o Princípio V da constitution) — ver quickstart.md.

**Target Platform**: Navegador web (SPA), mesmo alvo da tela da sala hoje —
desktop e mobile, mesmos breakpoints responsivos já usados em `RoomPage`.

**Project Type**: Web frontend único (este repositório) — sem mudanças em
`my-api`. Estrutura existente: `src/components/`, `src/pages/`, `src/hooks/`,
`src/services/`, `src/types/`.

**Performance Goals**: Transições fluidas (~60fps) em hardware comum;
`canvas-confetti` já é otimizado para isso. Sem impacto perceptível no tempo
de carregamento da tela da sala (biblioteca de confete é pequena e só é
importada quando a rodada realmente revela consenso — import dinâmico, ver
research.md §1).

**Constraints**: Sem novas dependências pesadas (Princípio I, YAGNI). Sem
mudanças no contrato de dados entre frontend e `my-api` (spec 003) — a
feature é 100% de apresentação. Deve continuar funcionando tanto no modo mock
(`localStorage` + `storage` event) quanto no modo API real (polling HTTP),
já que ambos expõem a mesma forma de `Sala`/`Rodada`.

**Scale/Scope**: Mesmo escopo de hoje — salas de poucos a poucas dezenas de
participantes. Toca apenas `RoomPage` e componentes relacionados a assentos e
resultado; não toca fluxo de criar/entrar sala.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidade Antes de Tudo (YAGNI)**: PASSA. Única dependência nova é
  `canvas-confetti` (pequena, zero deps, resolve exatamente o "burst" pedido
  na spec — construir isso à mão seria o tipo de esforço redundante que o
  princípio pede para evitar). Nenhuma biblioteca de animação genérica é
  adicionada; as transições reusam o padrão CSS já existente no projeto.
- **II. Sigilo do Voto É Inegociável**: PASSA. A feature só renderiza dados
  após `rodada.estado === "revelada"` (painel de resultado) ou dados já
  publicamente visíveis hoje (contagem regressiva não revela nenhum voto). Não
  adiciona nenhum novo caminho de leitura de voto individual antes do reveal.
- **III. Entrega Guiada por Spec**: PASSA. Este plano segue
  `specs/004-revelacao-resultado/spec.md`, aprovada antes deste plano.
- **IV. Salas Efêmeras e de Baixa Fricção**: PASSA. Não adiciona conta, senha
  nem persistência além do já existente.
- **V. Lógica Core Testável**: PASSA. A feature não altera a máquina de
  estados votar/revelar/resetar (spec 002, já testada). A nova lógica de
  agrupamento por valor votado é uma função pura derivada de dados já
  existentes (`Rodada.votos`) e será coberta por teste unitário por boa
  prática, ainda que não seja uma das transições enumeradas no princípio.
- **VI. Segurança por Padrão**: PASSA. Nenhuma superfície pública nova (sem
  endpoint, sem formulário, sem input de usuário novo) — só renderização de
  dados já existentes e validados. `security-review` ainda deve rodar antes de
  considerar a feature concluída, por governança padrão do projeto.

Nenhuma violação — **Complexity Tracking** não se aplica.

**Recheck pós-Fase 1** (após research.md/data-model.md/quickstart.md): os
artefatos de design não introduziram nenhuma entidade persistida, endpoint ou
dependência além do já avaliado acima (`canvas-confetti`, CSS puro para
transições). Gate permanece PASSA sem mudanças.

## Project Structure

### Documentation (this feature)

```text
specs/004-revelacao-resultado/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sem `contracts/` — esta feature não expõe nem consome nenhuma interface
nova (não toca a API de `my-api`, não adiciona endpoint nem contrato).

### Source Code (repository root)

```text
src/
├── pages/
│   ├── RoomPage.tsx                  # Orquestra a fase da rodada e decide
│   │                                  # ONDE cada coisa aparece: painel
│   │                                  # central (status/contagem), grade de
│   │                                  # assentos (sempre visível), e
│   │                                  # HandOfCards ↔ ResultadoAgrupado
│   │                                  # (um substitui o outro no lugar de
│   │                                  # "Suas cartas", nunca dentro da mesa)
│   └── RoomPage.module.css
├── components/
│   ├── MesaPainel/                   # NOVO — painel central: SÓ status/
│   │   ├── MesaPainel.tsx            # contador (spec US1/US2). Não recebe
│   │   └── MesaPainel.module.css     # o resultado — ver RoomPage acima.
│   ├── SeatCard/                     # EXISTENTE — ganha textura de verso de
│   │   ├── SeatCard.tsx              # carta (FR-003). Sempre visível, não
│   │   └── SeatCard.module.css       # sai de cena — só vira no lugar.
│   ├── HandOfCards/                  # EXISTENTE — ganha variantes de saída/
│   │   ├── HandOfCards.tsx           # entrada (spec US3/US4, FR-006) — é
│   │   └── HandOfCards.module.css    # esta grade que dá lugar ao resultado.
│   ├── ResultadoAgrupado/            # NOVO — grupos de avatares por valor
│   │   ├── ResultadoAgrupado.tsx     # votado, spec US3 (FR-007) — renderizado
│   │   └── ResultadoAgrupado.module.css  # no lugar de HandOfCards em RoomPage.
│   ├── Avatar/                       # NOVO — círculo com iniciais do nome
│   │   ├── Avatar.tsx                # (reusado por ResultadoAgrupado)
│   │   └── Avatar.module.css
│   └── RoundControls/, ThemeToggle/, ValorCarta/  # existentes, sem mudança
│                                       # de contrato
├── hooks/
│   └── useRevelacaoTransicao.ts      # NOVO — máquina de fases local
│                                       # (votando → contagem → virando →
│                                       # saindo → resultado → voltando →
│                                       # votando), spec FR-002/FR-004/
│                                       # FR-006/FR-013/FR-014
├── services/
│   ├── mock/roomStore.ts             # EXISTENTE — ganha agruparPorValor()
│   │                                   # ao lado de resumoRodada(), sem
│   │                                   # mudar assinatura desta última
│   ├── avatar.ts                     # NOVO — iniciais()/avatarDe(), spec
│   │                                   # US3 (FR-007), research.md §5
│   └── confetti.ts                   # NOVO — deveExibirConfete()/
│                                       # dispararConfete(), spec US5
│                                       # (FR-008/FR-009), research.md §1
└── types/room.ts                     # EXISTENTE — sem novos campos
                                        # persistidos; tipos derivados novos
                                        # (ex. DistribuicaoResultado) ficam
                                        # co-localizados com quem os usa
```

**Structure Decision**: Frontend único (este repositório), seguindo a
estrutura já existente (`components/`, `pages/`, `hooks/`, `services/`,
`types/`). Nenhuma pasta `backend/`/`api/` é criada aqui — mudanças de
backend não se aplicam a esta feature (ver Restrições Tecnológicas da
constitution: o backend real vive em `my-api`, e esta feature não o toca).

## Complexity Tracking

*Sem violações do Constitution Check — seção não se aplica.*
