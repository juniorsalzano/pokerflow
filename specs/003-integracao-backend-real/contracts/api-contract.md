# Contrato: API HTTP real (`my-api`, módulo `planning-poker`)

Este é o contrato **concreto de rede** — complementa (não substitui) o
contrato abstrato de `roomClient` já definido em
`specs/001-criar-entrar-sala/contracts/` e
`specs/002-rodada-votacao/contracts/api-contract.md`. `httpRoomClient.ts`
(frontend, `pokerflow`) implementa a interface `roomClient` chamando estes
endpoints, e é responsável por reconstruir os mesmos tipos (`Sala`,
`Rodada`, `RoomClientError`) que os componentes já consomem — nenhum
componente muda.

**Base URL**: configurável via env (`VITE_API_BASE_URL` no frontend). Todas
as rotas abaixo são relativas a essa base, montadas sob o módulo
`planning-poker` do `my-api` (ex.: `https://my-api.vercel.app/planning-poker`).

**Autenticação**: nenhuma (Princípio IV). Ações que exigem identidade levam
`participanteId` explicitamente no corpo/query — ver `research.md` §6.

**Content-Type**: `application/json` em todas as requisições e respostas.

## Formato de erro (todas as rotas)

Corpo, com o status HTTP correspondente (`research.md` §9):

```json
{ "codigo": "SALA_NAO_ENCONTRADA", "mensagem": "Essa sala não existe ou expirou." }
```

| `codigo` | Status HTTP |
|---|---|
| `SALA_NAO_ENCONTRADA` | 404 |
| `NOME_DUPLICADO` | 409 |
| `RODADA_JA_REVELADA` | 409 |
| `VALOR_INVALIDO` | 400 |
| `ENTRADA_INVALIDA` | 400 |
| `APENAS_MODERADOR` | 403 |

Falha de rede/servidor indisponível (timeout, 5xx, sem resposta) não usa esse
formato — `httpRoomClient.ts` trata como uma categoria própria de erro
("falha temporária", FR-009 da spec) e a UI mostra mensagem de "tente
novamente", distinta de "sala não encontrada".

## Formato de `Sala` nas respostas (redação de voto embutida)

Diferente do tipo interno `Sala`/`Rodada` do frontend, a rodada **na
resposta HTTP** nunca inclui o mapa `votos` completo antes da revelação —
isso é o que torna o sigilo do voto estrutural (Princípio II, sem mais
"best-effort"). Formato:

```jsonc
{
  "codigo": "ab3k9pq",
  "nome": "Refinamento Sprint 42",
  "escalaPontos": "fibonacci",
  "moderadorId": "5e1a...uuid",
  "participantes": [
    { "id": "5e1a...uuid", "nome": "Junior", "ehModerador": true, "entrouEm": 1732550000000 }
  ],
  "criadaEm": 1732550000000,
  "ultimaAtividadeEm": 1732550030000,
  "rodada": {
    "estado": "votando",
    "votantes": ["5e1a...uuid"],       // quem já votou nesta rodada — nunca o valor
    "meuVoto": "5"                      // só presente se o participanteId do request já votou; é o próprio valor dele
    // "votos" NÃO aparece aqui — estado ainda é "votando"
  }
}
```

Quando `rodada.estado === "revelada"`, `votos` (mapa completo
`participanteId → valor`) passa a existir, e `votantes`/`meuVoto` continuam
presentes por consistência:

```jsonc
"rodada": {
  "estado": "revelada",
  "votantes": ["5e1a...uuid", "9bf2...uuid"],
  "meuVoto": "5",
  "votos": { "5e1a...uuid": "5", "9bf2...uuid": "8" }
}
```

`httpRoomClient.ts` reconstrói o `Rodada.votos` interno (formato que
`SeatCard`/`RoomPage` já esperam) assim:
- **Revelada**: usa o `votos` completo vindo do servidor, direto.
- **Votando**: para cada `id` em `votantes`, usa o valor real só se
  `id === participanteId` (via `meuVoto`); para os demais, usa um valor
  placeholder não-vazio (ex.: `"•"`) só para que `voto !== undefined` continue
  disparando o estado "já votou" no `SeatCard` — o valor real de outro
  participante nunca chega ao cliente antes do reveal, então não há como
  vazar, mesmo inspecionando a rede.

## Endpoints

### `POST /planning-poker/rooms`

Cria uma sala. `[roomClient.criarSala]`

**Corpo**: `{ "nomeSala": string, "nomeCriador": string, "escalaPontos": "fibonacci" | "sequencial" | "camisetas" }`

**201**: `{ "codigo": string, "participanteId": string, "sala": Sala }`

**Erros**: `ENTRADA_INVALIDA` (nome de sala/criador vazio ou passa do limite).

---

### `POST /planning-poker/rooms/:codigo/participantes`

Entra em uma sala existente. `[roomClient.entrarNaSala]`

**Corpo**: `{ "nomeParticipante": string }`

**201**: `{ "participanteId": string, "sala": Sala }`

**Erros**: `SALA_NAO_ENCONTRADA`, `NOME_DUPLICADO`, `ENTRADA_INVALIDA`.

---

### `GET /planning-poker/rooms/:codigo?participanteId=<uuid>`

Consulta o estado atual da sala. `[roomClient.obterSala]` — também a rota
usada pelo polling (`research.md` §5).

`participanteId` é **opcional** na query: se omitido, a resposta não inclui
`rodada.meuVoto` (equivalente a "ninguém votou ainda" do ponto de vista de
quem pergunta) — usado apenas em cenários sem identidade conhecida ainda;
na prática, o frontend sempre manda o `participanteId` salvo no
`sessionStorage` assim que existir.

**200**: `Sala` (formato acima) — ou `null`/404 se não existir.

**Erros**: `SALA_NAO_ENCONTRADA` (inexistente ou expirada — `research.md` §4).

---

### `DELETE /planning-poker/rooms/:codigo/participantes/:participanteId`

Remove um participante da sala. `[roomClient.sairDaSala]`

**204**, sem corpo.

**Erros**: `SALA_NAO_ENCONTRADA`.

---

### `POST /planning-poker/rooms/:codigo/votos`

Registra ou substitui o voto do participante. `[roomClient.votar]`

**Corpo**: `{ "participanteId": string, "valor": string }`

**200**: `Sala` atualizada (formato acima, do ponto de vista de quem votou —
`meuVoto` reflete o valor que acabou de registrar).

**Erros**: `SALA_NAO_ENCONTRADA`, `RODADA_JA_REVELADA`, `VALOR_INVALIDO`.

---

### `POST /planning-poker/rooms/:codigo/revelar`

Revela os votos da rodada atual. `[roomClient.revelar]`

**Corpo**: `{ "participanteId": string }`

**200**: `Sala` atualizada, com `rodada.estado === "revelada"` e `votos` completo.

**Erros**: `SALA_NAO_ENCONTRADA`, `APENAS_MODERADOR`.

---

### `POST /planning-poker/rooms/:codigo/resetar`

Limpa os votos e volta ao estado `"votando"`. `[roomClient.resetar]`

**Corpo**: `{ "participanteId": string }`

**200**: `Sala` atualizada (`rodada.estado === "votando"`, `votantes: []`, sem `votos`).

**Erros**: `SALA_NAO_ENCONTRADA`, `APENAS_MODERADOR`.

## Rate limiting

Aplicado por IP de origem, só nas rotas deste módulo (`research.md` §8):

| Grupo de rotas | Limite |
|---|---|
| Leitura (`GET`) | 60 requisições / 60s |
| Escrita (`POST`/`DELETE`) | 20 requisições / 60s |

Ao estourar: `429 Too Many Requests`, corpo
`{ "codigo": "ENTRADA_INVALIDA", "mensagem": "Muitas requisições. Aguarde um instante." }`
(reaproveita o código genérico de entrada inválida — não há um código
dedicado no contrato abstrato de 001/002 para isso, e criar um novo só para
rate limit não é coberto por nenhuma spec de produto).
