# Implementation Plan: Higiene de Sessão da Sala

**Branch**: `005-higiene-sessao-sala` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-higiene-sessao-sala/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Quatro correções/melhorias de "higiene de sessão", encontradas em uso real com
o backend já em produção: (1) encerrar a sala inteira quando o moderador sai
ou fica ausente, em vez de deixá-la sem ninguém capaz de revelar/resetar; (2)
timeout no cliente para toda chamada à API, pra nenhuma ação ficar travada
indefinidamente sem resposta; (3) mensagem mais honesta quando "nome
duplicado" é a própria tentativa fantasma da pessoa; (4) o moderador poder
remover manualmente um participante. Abordagem técnica: reaproveitar ao
máximo as rotas e o mecanismo de heartbeat/expiração lazy já existentes
(`my-api`), evitando rota nova sempre que uma existente já cobre o caso;
mudanças de UI concentradas no `httpRoomClient.ts` e nas telas que já tratam
"sala não encontrada" hoje.

## Technical Context

**Language/Version**: TypeScript 5.6 (frontend, `pokerflow`) · TypeScript + NestJS 11 (backend, `my-api`, repositório irmão em `/home/junior/projetos/my-api`)

**Primary Dependencies**: React 18 + Vite 6 + React Router 7, Vitest/Testing Library (`pokerflow`, já existentes) · NestJS 11 + TypeORM 0.3 + `@nestjs/throttler`, Jest (`my-api`, já existentes) — nenhuma dependência nova em nenhum dos dois repositórios

**Storage**: Postgres já provisionado em `my-api` (tabela `planning_poker_rooms`, TypeORM) — reaproveitado, sem banco novo nem tabela nova (Princípio I)

**Testing**: Vitest (unit) no `pokerflow`; Jest unit + e2e contra o Postgres real no `my-api` — mesma convenção das features 001-004/003

**Target Platform**: Web (SPA estática, `pokerflow`) consumindo API serverless na Vercel (`my-api`) — sem mudança de plataforma

**Project Type**: Aplicação web com backend em repositório irmão fora desta árvore (não é o "frontend/backend no mesmo monorepo" padrão — ver Project Structure)

**Performance Goals**: Sem novo alvo numérico de performance — mantém polling de leitura a 2s e heartbeat a 45s já existentes; o único número novo é o timeout de ação do cliente (ver `research.md`, decidido em 10s)

**Constraints**: Toda mudança no `my-api` DEVE continuar 100% dentro do free tier Vercel (Hobby) — sem serviço novo, sem dependência paga; as novas rotas/comportamentos DEVEM respeitar o rate limiting já existente (20 req/60s para escrita de negócio, 60 req/60s para leitura/heartbeat) sem exigir um grupo novo

**Scale/Scope**: Mesma escala já assumida pelo produto (salas de poucas dezenas de participantes, sessões de curta duração — horas, não dias) — sem mudança de escala

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidade Antes de Tudo (YAGNI)** — PASS. A feature resolve gaps
  reais já observados em uso (não é generalidade especulativa) e mantém as
  exclusões de escopo já decididas (sem eleição/promoção de moderador, sem
  indicador de presença/atividade na UI). As decisões técnicas priorizam
  reaproveitar rotas e mecanismos já existentes (heartbeat, expiração lazy)
  em vez de introduzir infraestrutura nova.
- **II. Sigilo do Voto É Inegociável** — PASS. Nenhuma mudança desta feature
  expõe voto antes do reveal. Encerrar a sala ou remover um participante
  descarta o(s) voto(s) correspondente(s) do mesmo jeito que a saída
  explícita já faz hoje (herdado de `removeParticipant`) — sem mudança nesse
  invariante.
- **III. Entrega Guiada por Spec** — PASS. Esta é a sequência
  specify → plan já em andamento nesta branch.
- **IV. Salas Efêmeras e de Baixa Fricção** — **requer atenção, resolvido em
  research.md**. Cumprir FR-005 (mensagem distinta para "sala encerrada
  porque o moderador saiu" vs. "sala não encontrada/expirada") exige algum
  estado transitório que carregue esse motivo — decidido como um tombstone
  de vida bem curta (segundos, não horas), mais curto até que a própria
  janela de tolerância de presença (10min) e ordens de grandeza mais curto
  que o ciclo de vida normal de uma sala (4h). Não é um registro
  permanente nem um histórico — é compatível com o princípio. Ver
  `research.md` (decisão 3).
- **V. Lógica Core Testável (NÃO NEGOCIÁVEL)** — PASS. As mudanças de
  comportamento (encerrar sala ao sair/ficar ausente o moderador, remoção
  por outra pessoa que não o próprio dono do registro) entram como funções
  puras no domínio (`my-api/src/planning-poker/domain/room.ts`), na mesma
  convenção já usada por `reveal`/`reset`/`materializeAbsent`, com testes de
  unidade cobrindo os novos ramos.
- **VI. Segurança por Padrão** — PASS, com atenção documentada. A nova via de
  remoção (moderador remove outro participante) reaproveita exatamente o
  mesmo padrão de autorização já revisado em `reveal`/`reset`
  (`participantId` do requisitante + `token` secreto, comparado contra
  `room.moderatorId`) — não introduz um novo tipo de credencial. `/speckit-tasks`
  DEVE incluir teste e2e cobrindo o caso de um participante comum tentando
  remover outro (deve falhar com `NOT_AUTHORIZED`, conforme
  `contracts/api-contract.md`). `security-review` continua obrigatório ao final
  (Princípio VI), como em toda feature.
- **Restrição tecnológica (free tier, `my-api` isolado)** — PASS. Nenhuma
  dependência nova, nenhum módulo além de `src/planning-poker/` tocado,
  nenhum serviço pago.

## Project Structure

### Documentation (this feature)

```text
specs/005-higiene-sessao-sala/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code

Esta feature toca dois repositórios (decisão de arquitetura já registrada na
constitution, feature 003): o Spec Kit roda só aqui (`pokerflow`), mas parte
da implementação é escrita em `my-api` (repositório irmão, fora desta árvore).

```text
# pokerflow (este repositório) — UI e cliente HTTP
src/services/http/httpRoomClient.ts     # timeout via AbortController em callApi; nova ação de remover participante; leitura do novo ROOM_CLOSED_BY_MODERATOR
src/services/roomClient.ts              # assinatura da nova ação (kickParticipant) no contrato abstrato RoomClient
src/types/room.ts                       # novo código de erro (ROOM_CLOSED_BY_MODERATOR) no union de RoomClientErrorCode
src/hooks/                              # hook novo/estendido para acionar a remoção; ajuste de mensagem no fluxo de join (DUPLICATE_NAME)
src/components/ParticipantList/         # ação de remover (visível só ao moderador, com confirmação simples)
src/pages/RoomPage.tsx                  # telas de "sala encerrada pelo moderador" e "você foi removido"
src/components/JoinRoomForm/            # mensagem ajustada para DUPLICATE_NAME
tests/**/*.test.{ts,tsx}                # Vitest, colocalizados como já é convenção do repo

# my-api (repositório irmão, /home/junior/projetos/my-api) — domínio e API
src/planning-poker/domain/room.ts                # leaveRoom (encerra a sala se o alvo for moderador), materializeAbsent (idem), remoção como moderador (kick), tombstone de encerramento
src/planning-poker/planning-poker.service.ts     # orquestra os novos casos sobre o domínio acima
src/planning-poker/planning-poker.repository.ts  # withRoom: trata materializeAbsent podendo sinalizar "encerrar sala"; leitura respeita o tombstone
src/planning-poker/planning-poker.controller.ts  # DELETE .../participants/:id aceita requerente diferente do alvo (kick)
src/planning-poker/dto.ts                        # extensão dos parâmetros do endpoint de remoção
src/planning-poker/domain/room.spec.ts           # testes de unidade dos novos ramos do domínio
test/planning-poker.e2e-spec.ts                  # testes e2e contra o Postgres real
```

**Structure Decision**: sem estrutura nova — reaproveita exatamente os
arquivos já existentes das features 001-003 nos dois repositórios, sem criar
diretórios novos. Nenhuma rota HTTP nova é criada; as mudanças são extensões
de comportamento sobre rotas já existentes (`DELETE .../participants/:id`,
`GET .../:code`) mais o `httpRoomClient.ts` no frontend.

## Complexity Tracking

*Sem violações não-justificadas do Constitution Check acima — nada a
registrar nesta seção.*
