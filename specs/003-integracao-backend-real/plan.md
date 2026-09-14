# Plano de Implementação: Integração com Backend Real

**Branch**: `003-integracao-backend-real` | **Data**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificação da feature em `specs/003-integracao-backend-real/spec.md`

**Depende de**: features 001 e 002 (já implementadas e mescladas em `main`)
— todo o comportamento de sala/rodada já existe e é preservado; esta feature
troca o mock (`localStorage`/`BroadcastChannel`) pela API HTTP real.

## Resumo

Substituir `mockRoomClient.ts` por um `httpRoomClient.ts` que fala com uma
API real, implementada como um módulo NestJS isolado (`planning-poker`) no
repositório já existente `my-api`, reaproveitando o Postgres já provisionado
lá. Nenhum componente React muda — só a implementação de `roomClient` por
trás dos hooks (`useSala`, `useRodada`). A lógica de domínio (votar,
revelar, resetar, resumoRodada, validação, geração de código) é portada
quase literalmente do mock para uma camada `domain/` sem dependência de
HTTP/TypeORM, preservando o Princípio V (lógica core testável). Inclui
também o mecanismo de heartbeat de presença (US3, FR-010/FR-011,
`research.md` §14), que substitui a dependência original de `beforeunload`
no frontend — removida por contradizer a própria US3 (reconectar sem
perder identidade de moderador). Ver `research.md` para o racional de cada
decisão técnica.

## Contexto Técnico

**Linguagem/Versão**: TypeScript 5.x sobre Node 20+ nos dois repositórios
(mesmo runtime de 001/002 no frontend; `my-api` já usa Node 20+/NestJS 11).

**Dependências Principais**:
- `pokerflow` (frontend): nenhuma dependência nova — `httpRoomClient.ts`
  usa `fetch` nativo e `setInterval` para o polling (`research.md` §5).
- `my-api` (backend): `@nestjs/throttler` (nova, rate limiting escopado ao
  módulo — `research.md` §8). Tudo o mais (`@nestjs/typeorm`, `pg`,
  `@nestjs/common`) já está no projeto.

**Armazenamento**: Postgres já provisionado em `my-api` (via
`POSTGRES_URL`), tabela nova `planning_poker_rooms` (`jsonb` para
participantes/rodada — `research.md` §1, `data-model.md`). Exceção
documentada ao "sem banco por padrão" (constitution v1.5.0).

**Testes**:
- `my-api`: Jest (unit, domínio puro) + Jest/supertest (e2e, endpoints do
  módulo) — convenção já existente no projeto.
- `pokerflow`: Vitest, suíte existente reaproveitada sem mudança de
  expectativa (SC-003) — só troca a implementação de `roomClient` sob teste.

**Plataforma Alvo**: web, responsivo (mesma de 001/002); backend como função
serverless na Vercel (free tier), mesmo deploy que já serve `my-api`.

**Tipo de Projeto**: aplicação web com backend em repositório separado —
não se encaixa nas opções padrão de projeto único ou monorepo frontend+backend
do template; ver "Estrutura do Projeto" abaixo para os dois repositórios
envolvidos.

**Metas de Performance**: mudança de estado visível entre dispositivos
diferentes em até 5s (SC-002), com polling a cada 2s (`research.md` §5) —
folga de ~2.5x sobre a meta. Sinal de presença (heartbeat) desacoplado
desse polling, enviado a cada 45s (FR-010); participante ausente por 10
minutos seguidos é removido da sala (FR-011, `research.md` §14).

**Restrições**: sem WebSocket persistente (free tier Vercel); backend não
pode introduzir custo novo (reaproveita `my-api` e seu Postgres); Spec Kit
continua só neste repositório (`my-api` não ganha `.specify/` próprio);
correções de segurança/qualidade ficam restritas ao módulo `planning-poker`
— sem tocar em `auth`/`users`/`resume-log` do `my-api` (decisão combinada
com o usuário).

**Escala/Escopo**: mesma de 001/002 (~15 participantes/sala); expiração por
inatividade preguiçosa, sem job de limpeza (`research.md` §4).

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| I. Simplicidade (YAGNI) | PASSA COM NOTA — reaproveita Postgres já existente do `my-api` em vez de criar infra nova (nota adicionada ao Princípio I, v1.5.0); modelo `jsonb` de 1-linha-por-sala escolhido para não normalizar sem necessidade (`research.md` §1). |
| II. Sigilo do voto | PASSA — deixa de ser best-effort (nota do Princípio II, v1.4.1): o servidor nunca serializa o valor de voto de outro participante antes do reveal (`data-model.md` §Sigilo, `contracts/api-contract.md`). A nota da constitution pode ser revisitada como resolvida quando esta feature for implementada. |
| III. Entrega guiada por spec | PASSA — deriva de `spec.md` aprovada. |
| IV. Salas efêmeras/baixa fricção | PASSA — sem conta/senha; identidade via `participanteId` opaco (`research.md` §6); expiração por inatividade preservada. |
| V. Lógica core testável | PASSA — `votar`/`revelar`/`resetar`/`resumoRodada` portados como funções puras em `domain/`, sem HTTP/TypeORM, testadas em Jest com os mesmos casos do Vitest atual (`research.md` §10). |
| VI. Segurança por padrão | PASSA COM NOTA — validação/sanitização portada da lógica já testada (sem nova dependência); rate limiting via `@nestjs/throttler` escopado ao módulo, com limitação documentada (contagem por instância serverless, não global — `research.md` §8, mesma categoria de ressalva já usada para o Princípio II na fase mock); erros mapeados sem vazar detalhe técnico (`research.md` §9). |
| Restrições Tecnológicas / Backend real (`my-api`) | PASSA — módulo isolado, Postgres já provisionado (exceção documentada), sem WebSocket persistente, polling HTTP dentro do limite já previsto. |

Nenhuma violação sem justificativa. Tabela de Complexidade não se aplica.

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/003-integracao-backend-real/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md         # Fase 1
├── quickstart.md         # Fase 1
└── contracts/
    └── api-contract.md   # Fase 1 — contrato HTTP concreto
```

### Código-fonte — dois repositórios

**`pokerflow`** (este repositório — frontend):

```text
src/
├── services/
│   ├── roomClient.ts          # Interface já existente (001) + método novo enviarPresenca
│   ├── mock/                  # mockRoomClient ganha enviarPresenca como no-op (sem heartbeat no mock)
│   └── http/
│       └── httpRoomClient.ts  # NOVO — implementa roomClient via fetch + polling + heartbeat
├── hooks/
│   ├── useSala, useRodada     # sem mudança (consomem roomClient)
│   └── usePresenca.ts         # NOVO — setInterval de 45s chamando enviarPresenca
└── pages/RoomPage.tsx         # passa a montar usePresenca enquanto a sala está aberta

tests/unit/
├── httpRoomClient.*.test.ts   # mocka fetch, valida montagem de request/redação de resposta + heartbeat
└── usePresenca.test.ts        # NOVO — confirma intervalo/limpeza no unmount
```

**`my-api`** (`/home/junior/projetos/my-api` — backend, fora deste repositório):

```text
src/
└── planning-poker/                       # NOVO módulo, isolado dos demais
    ├── domain/                           # Funções puras, portadas do mock (research.md §10)
    │   ├── room.ts                       # criarSala, votar, revelar, resetar, resumoRodada, estaExpirada
    │   │                                  # + registrarPresenca, materializarAusentes (research.md §14)
    │   ├── validation.ts                 # validarNomeSala, validarNomeParticipante, sanitizar
    │   ├── generateRoomCode.ts
    │   └── room-client-error.ts          # RoomClientError (mesmo formato do frontend)
    ├── room.entity.ts                    # Mapeamento TypeORM (data-model.md), inclui ultimaPresencaEm
    ├── planning-poker.repository.ts      # Leitura/escrita com lock de linha (research.md §3)
    ├── planning-poker.controller.ts      # Rotas de contracts/api-contract.md
    ├── planning-poker.service.ts         # Adaptador fino: HTTP <-> domínio <-> repositório
    ├── planning-poker.exception-filter.ts # Mapeia RoomClientError -> HTTP (research.md §9)
    └── planning-poker.module.ts          # Registrado em AppModule, sem alterar módulos existentes

test/ (Jest, convenção já existente do my-api)
├── planning-poker/
│   ├── room.spec.ts                      # Unit — domínio puro (equivalente aos roomStore.*.test.ts)
│   ├── validation.spec.ts
│   └── resumo-rodada.spec.ts
└── planning-poker.e2e-spec.ts            # e2e — endpoints via supertest
```

**Decisão de Estrutura**: dois repositórios, um plano só. O fluxo Spec Kit
(`/speckit-*`) roda inteiramente em `pokerflow`; os arquivos listados sob
`my-api` acima são criados/editados diretamente naquele repositório durante
`/speckit-implement`, seguindo as convenções que já existem lá (Jest,
ESLint/Prettier próprios), sem introduzir `.specify/` por lá. Isso foi uma
decisão explícita (ver constitution, "Backend real: repositório `my-api`" e
a conversa que originou a spec 003) — não é um desvio acidental do padrão de
projeto único usado em 001/002.

## Complexity Tracking

Não se aplica — nenhuma violação do Constitution Check sem justificativa
(todas as ressalvas acima já são "PASSA COM NOTA", documentadas em linha,
não violações abertas).
