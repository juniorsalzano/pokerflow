# Plano de Implementação: Rodada de Votação

**Branch**: `002-rodada-votacao` | **Data**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificação da feature em `specs/002-rodada-votacao/spec.md`

**Depende de**: feature 001 (já implementada e mesclada em `main`) — sala,
participantes, moderador e escala de pontos já existem.

## Resumo

Adicionar votação oculta, revelação e reset de rodada dentro da tela de sala
já existente (`RoomPage`), substituindo o aviso placeholder deixado pela
feature 001 ("a rodada de votação chega em uma próxima atualização"). Tudo
implementado sobre a mesma infraestrutura mockada de 001 (localStorage +
BroadcastChannel por sala) — sem nova dependência de animação, sem nova
infraestrutura.

## Contexto Técnico

**Linguagem/Versão**: TypeScript 5.x sobre Node 20+ (mesmo de 001)

**Dependências Principais**: React 18, Vite, CSS Modules — nenhuma
biblioteca de animação nova. O efeito de "virar carta" é feito com CSS 3D
puro (`perspective` + `rotateY` + `backface-visibility`), com atraso
escalonado por carta via `transition-delay` calculado por índice — ver
`research.md`.

**Armazenamento**: mesmo mock de 001 (localStorage + BroadcastChannel por
`codigo` de sala), estendendo o objeto `Sala` com um campo `rodada`.

**Testes**: Vitest, estendendo `src/services/mock/roomStore.ts` com testes
para votar/revelar/resetar e a regra de "apenas moderador".

**Plataforma Alvo**: mesma de 001 (web, responsivo — SC-005 desta spec).

**Tipo de Projeto**: extensão do app único já existente, sem novas pastas de
alto nível.

**Metas de Performance**: registrar/trocar voto em <2s (SC-001); revelar
refletido para todos em <2s (SC-003); resetar e poder votar de novo em <2s
(SC-004) — tudo local (mock), sem rede envolvida, folgado dentro da meta.

**Restrições**: sigilo do voto é **best-effort** nesta fase mockada (nota
adicionada ao Princípio II da constitution, v1.4.1) — a UI nunca exibe o
voto de outro participante antes da revelação, mas alguém inspecionando o
`localStorage` do próprio navegador tecnicamente poderia. Garantia
estrutural completa só existe quando a API real substituir o mock.

**Escala/Escopo**: mesma de 001 (~15 participantes por sala); reaproveita a
rota `/sala/:codigo` existente.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| I. Simplicidade (YAGNI) | PASSA — sem nova lib de animação, sem nova infra; reaproveita tudo de 001. |
| II. Sigilo do voto | PASSA COM RESSALVA DOCUMENTADA — best-effort na fase mock (nota do Princípio II, v1.4.1); UI nunca renderiza voto alheio antes do reveal. |
| III. Entrega guiada por spec | PASSA — deriva de `spec.md` já aprovada. |
| IV. Salas efêmeras/baixa fricção | PASSA — nada muda aqui. |
| V. Lógica core testável | PASSA — votar/revelar/resetar como funções puras em `roomStore.ts`, testáveis via Vitest sem UI. |
| VI. Segurança por padrão | PASSA COM NOTA — valor de voto validado contra a escala da sala; ação de revelar/resetar valida `moderadorId` na lógica pura (enforcement real de servidor fica para a API futura). |
| Restrições Tecnológicas | PASSA — nenhuma infraestrutura nova; ainda 100% client-side. |

Nenhuma violação. Tabela de Complexidade não se aplica.

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/002-rodada-votacao/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
└── contracts/
    └── api-contract.md  # Fase 1 — métodos novos do roomClient
```

### Código-fonte (extensão do projeto existente)

```text
src/
├── components/
│   ├── HandOfCards/         # Baralho clicável do próprio participante (US1)
│   ├── SeatCard/             # Cartinha de status por participante: vazia / verso / revelada (US1-US2)
│   ├── RoundControls/        # Botões Revelar/Resetar, só para o moderador (US2-US3)
│   └── ConsensusBadge/       # Indicador de consenso/dispersão pós-reveal (US2)
├── hooks/
│   └── useRodada.ts          # votar/revelar/resetar + estado da rodada atual
├── services/mock/
│   └── roomStore.ts          # + votar, revelar, resetar, resumoRodada (estende o de 001)
├── pages/
│   └── RoomPage.tsx           # Substitui o placeholder de 001 pela UI de votação
└── types/
    └── room.ts                # + Rodada, EstadoRodada (estende o de 001)

tests/unit/
├── roomStore.votar.test.ts
├── roomStore.revelar.test.ts
├── roomStore.resetar.test.ts
├── roomStore.apenasModerador.test.ts
└── roomStore.resumoRodada.test.ts
```

**Decisão de Estrutura**: nenhuma pasta de alto nível nova — a feature entra
como extensão natural do app único de 001, seguindo o mesmo padrão de
componentes/hooks/services já estabelecido.

## Complexity Tracking

Não se aplica — nenhuma violação do Constitution Check.
