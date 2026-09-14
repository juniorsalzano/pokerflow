---
description: "Lista de tarefas para a feature Rodada de Votação"
---

# Tarefas: Rodada de Votação

**Entrada**: Documentos de design de `specs/002-rodada-votacao/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md — e a feature 001, já implementada e mesclada em `main`.

**Testes**: incluídos — mesmo padrão de 001 (Princípio V/VI da constitution).

**Organização**: tarefas agrupadas por história de usuário (spec.md).

## Formato: `[ID] [P?] [História?] Descrição com caminho de arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1/US2/US3]**: história de usuário correspondente (spec.md)

## Fase 1: Setup

Nada novo a configurar — reaproveita integralmente o projeto, dependências e
ferramentas já estabelecidos na feature 001 (React, Vite, TypeScript,
Vitest, ESLint/Prettier, CSS Modules). Nenhuma dependência nova é adicionada
(ver `research.md` §1 — efeito de carta em CSS puro, sem biblioteca de
animação).

---

## Fase 2: Fundação (Bloqueia Todas as Histórias)

**⚠️ CRÍTICO**: nenhuma história de usuário começa antes desta fase terminar.

- [X] T001 Estender tipos em `src/types/room.ts`: adicionar `EstadoRodada` (`'votando' | 'revelada'`), `Rodada` (`{ estado: EstadoRodada; votos: Record<string, string> }`), e o campo `rodada: Rodada` em `Sala`
- [X] T002 Estender `ErroRoomClient`/`RoomClientError` em `src/types/room.ts` com os códigos `RODADA_JA_REVELADA`, `VALOR_INVALIDO`, `APENAS_MODERADOR` (depende de T001)
- [X] T003 Estender `criarSala` em `src/services/mock/roomStore.ts` para inicializar `rodada: { estado: 'votando', votos: {} }` em toda sala nova (depende de T001)
- [X] T004 Implementar `votar(sala, participanteId, valor, agora?)` em `src/services/mock/roomStore.ts` — rejeita com `RODADA_JA_REVELADA` se `rodada.estado !== 'votando'`; rejeita com `VALOR_INVALIDO` se `valor` não pertencer a `ESCALAS_PONTOS[sala.escalaPontos]`; senão sobrescreve `votos[participanteId]` (permite trocar o voto — FR-005) (depende de T001, T002)
- [X] T005 Implementar `revelar(sala, participanteId)` em `roomStore.ts` — rejeita com `APENAS_MODERADOR` se `participanteId !== sala.moderadorId`; senão muda `rodada.estado` para `'revelada'` (depende de T002)
- [X] T006 Implementar `resetar(sala, participanteId)` em `roomStore.ts` — mesma validação de moderador de T005; limpa `rodada.votos` e volta `estado` para `'votando'`, aceito em qualquer estado atual (FR-012) (depende de T002)
- [X] T007 Implementar `resumoRodada(sala)` (função pura, derivada, não persistida) em `roomStore.ts` — consenso se todos os votos forem idênticos; dispersão (faixa mínimo–máximo) se a escala for `fibonacci`/`sequencial` e todos os votos computados forem numéricos; senão "sem-consenso" (research.md §2). **DEVE iterar sobre `sala.participantes` (não sobre `Object.keys(sala.rodada.votos)`)** — assim, o voto de alguém que já saiu da sala (e não está mais em `participantes`) não conta no consenso/dispersão nem aparece em `naoVotaram`, conforme o Caso de Borda da spec ("voto de quem sai deixa de contar") (depende de T001)
- [X] T008 Estender a interface `roomClient` em `src/services/roomClient.ts` com `votar`, `revelar`, `resetar` conforme `contracts/api-contract.md` (depende de T001, T002)
- [X] T009 Implementar `votar`/`revelar`/`resetar` em `src/services/mock/mockRoomClient.ts`, delegando à lógica pura (T004-T006) e reaproveitando `salvarSala`/`notificarLocal`/`BroadcastChannel` já existentes de 001 (depende de T004, T005, T006, T008)

**Checkpoint**: fundação pronta — as histórias de usuário podem começar.

---

## Fase 3: História de Usuário 1 - Votar em uma rodada (Prioridade: P1) 🎯 MVP

**Objetivo**: participante vê o baralho de cartas da escala da sala, vota clicando em uma carta, seu voto fica oculto para os demais mas visível para si mesmo, e pode trocar de carta livremente antes da revelação.

**Teste Independente**: dois participantes na mesma sala — um vota, o outro deve ver só "já votou" sem o valor; o primeiro deve poder trocar de carta livremente.

### Testes para História 1

- [X] T010 [P] [US1] Testes unitários de `votar` (registra o valor, permite trocar antes de revelar, rejeita valor fora da escala com `VALOR_INVALIDO`, rejeita voto após `RODADA_JA_REVELADA`) em `tests/unit/roomStore.votar.test.ts`
- [X] T010a [P] [US1] Teste de componente (React Testing Library): `SeatCard` NUNCA renderiza no DOM o valor votado por outro participante quando `revelado=false` — apenas o indicador "já votou" (FR-003/FR-004/SC-002) em `tests/unit/SeatCard.test.tsx` (depende de T015 existir para rodar, mas deve ser escrito antes/junto)

### Implementação da História 1

- [X] T011 [US1] Implementar hook `useRodada` em `src/hooks/useRodada.ts` — expõe `votar(valor)` chamando `roomClient.votar` (depende de T009)
- [X] T012 [P] [US1] Construir `HandOfCards` em `src/components/HandOfCards/HandOfCards.tsx` — baralho com os valores de `ESCALAS_PONTOS[sala.escalaPontos]`, carta selecionada com destaque visual; o valor `"☕"` é renderizado com um ícone SVG de xícara (stroke-based) em vez do caractere emoji (research.md §3, Identidade Visual do CLAUDE.md)
- [X] T013 [US1] Integrar `HandOfCards` + `useRodada` em `src/pages/RoomPage.tsx`, substituindo o aviso placeholder deixado pela feature 001 (depende de T011, T012)
- [X] T014 [US1] Implementar o efeito de "virar carta" em CSS 3D puro (`perspective` + `rotateY` + `backface-visibility`) em `HandOfCards.module.css` (research.md §1) — sem biblioteca de animação
- [X] T015 [US1] Construir `SeatCard` (cartinha de status por participante: vazia = não votou, verso = votou e oculto) em `src/components/SeatCard/SeatCard.tsx`, sem nunca expor o valor de outro participante antes do reveal (FR-003/FR-004a)
- [X] T016 [US1] Integrar `SeatCard` na lista de participantes de `RoomPage.tsx`, substituindo o indicador simples de 001 (depende de T015)
- [X] T017 [US1] Garantir que o próprio participante sempre vê o valor que votou, mesmo antes da revelação (FR-004a) em `HandOfCards.tsx`/`useRodada.ts`
- [X] T017a [P] [US1] Teste de componente: `SeatCard` renderiza o valor do PRÓPRIO participante mesmo com `revelado=false` (FR-004a) em `tests/unit/SeatCard.test.tsx` (mesmo arquivo de T010a)

**Checkpoint**: História 1 funcional e testável de forma independente.

---

## Fase 4: História de Usuário 2 - Revelar os votos da rodada (Prioridade: P1)

**Objetivo**: o moderador revela os votos da rodada atual; todos os valores ficam visíveis, quem não votou aparece marcado, e nenhum voto pode mais ser alterado.

**Teste Independente**: com participantes já tendo votado, o moderador revela; valores aparecem para todos e tentativas de trocar o voto são bloqueadas.

### Testes para História 2

- [X] T018 [P] [US2] Testes unitários de `revelar` (muda `estado` para `'revelada'`, mantém os votos já registrados, rejeita com `APENAS_MODERADOR` quando quem chama não é o moderador) em `tests/unit/roomStore.revelar.test.ts`
- [X] T019 [P] [US2] Testes unitários de `resumoRodada` (consenso quando todos votam igual, dispersão min–max para escalas numéricas, "sem-consenso" para `camisetas` ou mistura com `?`/`☕`, participantes sem voto aparecem em `naoVotaram`, e um voto órfão de alguém que já saiu da sala NÃO conta no cálculo — ver T007) em `tests/unit/roomStore.resumoRodada.test.ts`

### Implementação da História 2

- [X] T020 [US2] Estender `useRodada` em `src/hooks/useRodada.ts` com `revelar()` chamando `roomClient.revelar` (depende de T009)
- [X] T021 [P] [US2] Construir `RoundControls` (botões Revelar/Resetar) em `src/components/RoundControls/RoundControls.tsx`, visível apenas quando `ehModerador` for verdadeiro
- [X] T022 [US2] Atualizar `SeatCard` para virar e exibir o valor quando `rodada.estado === 'revelada'`, com marcação clara para quem não votou (depende de T015)
- [X] T023 [P] [US2] Construir `ConsensusBadge` em `src/components/ConsensusBadge/ConsensusBadge.tsx`, consumindo `resumoRodada`
- [X] T024 [US2] Integrar `RoundControls` + `ConsensusBadge` em `RoomPage.tsx` (depende de T020, T021, T023)
- [X] T025 [US2] Implementar o efeito escalonado (`transition-delay` por índice, ~60ms) ao virar todas as cartas no reveal, em `SeatCard.module.css` (research.md §1)
- [X] T026 [US2] Bloquear a troca de voto na UI quando `rodada.estado === 'revelada'` (desabilitar `HandOfCards`) (depende de T013)

**Checkpoint**: Histórias 1 e 2 funcionam juntas — votar oculto e revelar.

---

## Fase 5: História de Usuário 3 - Resetar a rodada (Prioridade: P2)

**Objetivo**: o moderador reseta a rodada, limpando os votos e preparando uma nova votação com os mesmos participantes.

**Teste Independente**: revelar uma rodada e resetar; os votos somem e uma nova votação oculta começa sem recriar a sala.

### Testes para História 3

- [X] T027 [P] [US3] Testes unitários de `resetar` (limpa os votos, aceito antes e depois de revelada — FR-012, rejeita com `APENAS_MODERADOR` quando quem chama não é o moderador) em `tests/unit/roomStore.resetar.test.ts`

### Implementação da História 3

- [X] T028 [US3] Estender `useRodada` em `src/hooks/useRodada.ts` com `resetar()` chamando `roomClient.resetar` (depende de T009)
- [X] T029 [US3] Integrar o botão Resetar de `RoundControls` chamando `useRodada().resetar()`, reabilitando `HandOfCards` e ocultando `ConsensusBadge` quando a rodada volta a `'votando'` (depende de T021, T028)

**Checkpoint**: as 3 histórias funcionam juntas — ciclo completo votar → revelar → resetar.

---

## Fase Final: Polimento e Preocupações Transversais

- [X] T030 [P] Estender `tests/unit/mockRoomClient.salasSimultaneas.test.ts` (feature 001) com casos de rodada: votar/revelar em uma sala não afeta a rodada de outra sala simultânea
- [X] T031 [P] Rodar `npm run build` e confirmar build de produção sem erros/avisos
- [X] T032 Executar a validação manual ponta a ponta de `quickstart.md` e registrar o resultado
- [X] T033 [P] Rodar a skill `security-review` sobre a feature completa antes de considerá-la concluída (Princípio VI da constitution)
- [X] T034 Revisar as mensagens de erro (`RODADA_JA_REVELADA`, `VALOR_INVALIDO`, `APENAS_MODERADOR`) garantindo que sejam amigáveis e não exponham detalhes técnicos

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: nada a fazer — pode pular direto para a Fundação
- **Fundação (Fase 2)**: BLOQUEIA todas as histórias
- **Histórias de Usuário (Fase 3+)**: todas dependem da Fundação
  - US2 depende de `SeatCard` (criado em US1, T015) para exibir o reveal
  - US3 depende de `RoundControls` (criado em US2, T021)
- **Polimento (Fase Final)**: depende de todas as histórias completas

### Oportunidades de Paralelismo

- Testes unitários marcados [P] em cada história podem rodar em paralelo
- `HandOfCards` (US1) e a extensão de `SeatCard`/`ConsensusBadge` (US2) tocam arquivos diferentes e podem avançar em paralelo depois da Fundação

---

## Exemplo de Paralelismo: História 1

```bash
Task: "Testes unitários de votar em tests/unit/roomStore.votar.test.ts"
Task: "Construir HandOfCards em src/components/HandOfCards/HandOfCards.tsx"
```

---

## Estratégia de Implementação

### MVP primeiro (só História 1)

1. Completar Fase 2 (Fundação — CRÍTICA, bloqueia tudo)
2. Completar Fase 3 (História 1 — votar oculto)
3. **PARAR e VALIDAR**: votar em duas abas, confirmar sigilo visual e troca de voto

### Entrega incremental

1. Fundação → base pronta
2. História 1 (votar) → testar → demo
3. História 2 (revelar) → testar → demo (ciclo de valor: comparar estimativas)
4. História 3 (resetar) → testar → demo (ciclo completo de rodadas)
5. Polimento (isolamento entre salas, build, quickstart, security-review) → feature 002 concluída
