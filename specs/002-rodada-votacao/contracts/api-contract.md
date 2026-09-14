# Contrato: roomClient (extensão da feature 002)

Estende `src/services/roomClient.ts` (definido em 001) com os métodos da
rodada de votação. Mesma regra de 001: hoje implementado por
`mock/mockRoomClient.ts`; quando a API real existir, uma implementação HTTP
segue o mesmo contrato sem mudar a UI.

## `votar(codigo, participanteId, valor): Promise<Sala>`

`[futuro: POST /api/rooms/:codigo/votos { participanteId, valor }]`

Registra ou substitui o voto do participante na rodada atual.

**Erros**:
- `RODADA_JA_REVELADA` — a rodada atual já foi revelada; vote é rejeitado
  até o próximo reset (FR-006 da spec, "votos travados após revelar").
- `VALOR_INVALIDO` — o valor não pertence à escala de pontos da sala.
- `SALA_NAO_ENCONTRADA` — mesmo erro de 001, se o código não existir/expirou.

## `revelar(codigo, participanteId): Promise<Sala>`

`[futuro: POST /api/rooms/:codigo/revelar { participanteId }]`

Revela os votos da rodada atual para todos. `participanteId` é de quem está
chamando a ação (para validar que é o moderador).

**Erros**:
- `APENAS_MODERADOR` — quem chamou não é o moderador da sala.

## `resetar(codigo, participanteId): Promise<Sala>`

`[futuro: POST /api/rooms/:codigo/resetar { participanteId }]`

Limpa os votos da rodada atual e volta o estado para `'votando'`. Aceito
antes ou depois de revelada (idempotente em relação ao estado).

**Erros**:
- `APENAS_MODERADOR` — mesmo critério de `revelar`.

## Métodos existentes de 001 sem mudança de assinatura

`criarSala`, `entrarNaSala`, `obterSala`, `assinarSala`, `sairDaSala`
continuam iguais — `obterSala`/`assinarSala` agora incluem o campo
`rodada` no objeto `Sala` retornado (ver `data-model.md`).
