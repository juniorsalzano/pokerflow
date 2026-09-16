# Contrato: mudanças na API HTTP real (`my-api`, módulo `planning-poker`)

Este documento é um **delta** sobre
`specs/003-integracao-backend-real/contracts/api-contract.md` — descreve só o
que muda ou é novo nesta feature. Tudo que não é mencionado aqui permanece
exatamente como já documentado em 003 (formato de `Sala`, autenticação por
`participantId`+`token`, rate limiting, demais endpoints).

## Novo código de erro

Adiciona-se à tabela de erros já existente:

| `code` | Status HTTP |
|---|---|
| `ROOM_CLOSED_BY_MODERATOR` | 410 (Gone) |

Corpo, mesmo formato dos demais erros:

```json
{ "code": "ROOM_CLOSED_BY_MODERATOR", "message": "A sala foi encerrada porque o moderador saiu." }
```

## `GET /planning-poker/rooms/:code`

**Sem mudança de assinatura.** Durante a janela curta de tombstone (ver
`research.md`, decisão 4 — proposta: 30s) depois que a sala foi encerrada por
saída/ausência do moderador, passa a devolver `410 Gone` com
`ROOM_CLOSED_BY_MODERATOR` em vez do corpo normal de `Sala`. Passada essa
janela, comportamento idêntico ao já existente (`404`
`ROOM_NOT_FOUND`) — indistinguível de uma sala que nunca existiu ou expirou
por inatividade geral.

## `DELETE /planning-poker/rooms/:code/participants/:participantId`

**Efeito estendido quando o alvo é o moderador** (saída explícita, FR-001):
em vez de só remover esse participante, a sala inteira é encerrada
(tombstone descrito acima). Sem mudança de assinatura, sem novo parâmetro
para esse caso — o comportamento muda de acordo com quem `:participantId`
identifica.

**Novos parâmetros de query, opcionais** — habilitam o moderador a remover
*outro* participante (User Story 3, kick):

```
DELETE /planning-poker/rooms/:code/participants/:participantId?token=<opcional-se-requesterId>&requesterId=<uuid>&requesterToken=<secreto>
```

- **Sem `requesterId`/`requesterToken`** (comportamento atual, inalterado):
  `:participantId` remove a si mesmo — `token` (query) precisa bater com o
  próprio `:participantId`.
- **Com `requesterId`/`requesterToken`**, e `requesterId !== :participantId`:
  o pedido é tratado como remoção por outra pessoa. Exige `requesterId ===
  room.moderatorId` e `requesterToken` batendo com o token real do
  moderador. `:participantId` é removido independente do próprio token dele
  (o requisitante já provou ser o moderador).

**204**, sem corpo — mesmo formato de hoje, incluindo idempotência (sala
já inexistente/expirada → `204` sem erro; participante já removido por outro
motivo um instante antes → `204` sem erro, mesmo padrão de idempotência já
adotado).

**Erros**:
- `NOT_AUTHORIZED` — `requesterId` informado não é `room.moderatorId`, ou
  `requesterToken` não bate com o token real do moderador (mesmo código já
  usado para credencial inválida em geral, ex. em `reveal`/`reset`).
- Todos os erros já documentados em 003 continuam válidos para o caso de
  auto-remoção sem `requesterId`.

## Endpoints inalterados nesta feature

`POST /rooms`, `POST /rooms/:code/participants`, `POST /rooms/:code/votes`,
`POST /rooms/:code/reveal`, `POST /rooms/:code/reset`,
`POST /rooms/:code/heartbeat` — sem mudança de contrato. O timeout de
10s (decisão 1 do `research.md`) e a mensagem ajustada de `DUPLICATE_NAME`
(decisão implícita, User Story 4 do spec) são inteiramente client-side
(`httpRoomClient.ts`), sem efeito no contrato de rede.
