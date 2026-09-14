# Contrato: roomClient

Esta é a interface que `src/services/roomClient.ts` expõe para a UI. Hoje é
implementada por `mock/mockRoomClient.ts` (localStorage + BroadcastChannel);
quando a API real existir (Vercel Functions em `api/`), uma implementação
`http/httpRoomClient.ts` seguirá exatamente este mesmo contrato — a UI não
muda.

As assinaturas já são desenhadas no formato que os futuros endpoints HTTP
vão espelhar (indicado entre colchetes), para que a troca seja mecânica.

## `criarSala(input): Promise<{ codigo: string; sala: Sala }>`

`[futuro: POST /api/rooms]`

**Entrada**: `{ nomeSala: string; nomeCriador: string; escalaPontos: EscalaPontos }`

**Saída**: código único da sala + o objeto `Sala` completo, com o criador já
incluído em `participantes` e marcado `ehModerador: true`.

**Erros**: campo obrigatório ausente/vazio → erro de validação (a UI impede
o envio antes disso, mas o contrato também valida — Princípio VI).

## `entrarNaSala(codigo, nomeParticipante): Promise<{ participanteId: string; sala: Sala }>`

`[futuro: POST /api/rooms/:codigo/participantes]`

**Erros**:
- `SALA_NAO_ENCONTRADA` — código inexistente ou sala expirada (FR-009).
- `NOME_DUPLICADO` — já existe participante ativo com esse nome (case-insensitive) na sala (FR-006).

## `obterSala(codigo): Promise<Sala | null>`

`[futuro: GET /api/rooms/:codigo]`

Retorna o estado atual da sala, ou `null` se não existir/expirou.

## `assinarSala(codigo, callback): () => void`

Sem equivalente HTTP direto — na implementação mockada, assina eventos do
`BroadcastChannel`/`storage` e chama `callback(sala)` a cada mudança. Na
implementação HTTP futura, isso vira polling interno (intervalo definido na
constitution/plan da integração real) que chama `obterSala` periodicamente e
dispara `callback` quando o estado mudar. Retorna uma função para cancelar a
assinatura (usada no `useEffect` de limpeza dos hooks).

## `sairDaSala(codigo, participanteId): Promise<void>`

`[futuro: DELETE /api/rooms/:codigo/participantes/:participanteId]`

Chamado ao fechar a aba (`beforeunload`) ou ao clicar em "sair", quando essa
ação existir na UI.
