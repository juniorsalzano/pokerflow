# Data Model: Higiene de Sessão da Sala

Sem entidade nova e sem tabela nova. Extensões pontuais sobre `Sala` (já
definida em 001/003) e um novo código de erro no contrato. `Participante` não
ganha nenhum campo novo.

## Sala (`InternalRoom`, `my-api`)

| Campo | Tipo | Observação |
|---|---|---|
| `closedAt` | `number \| undefined` (timestamp) | **Novo.** Presente só durante a janela curta de tombstone (decisão 4 do `research.md`) após o moderador sair/ficar ausente. Ausente em toda sala "normal" — não é persistido para sempre, nem aparece em nenhuma resposta pública de `Sala`. |

Nenhum outro campo muda. `participants`, `round`, `moderatorId`,
`lastActivityAt` etc. continuam exatamente como já definidos em
`specs/003-integracao-backend-real/data-model.md` (se existir) / `room.ts`.

### Estados e transições

```
sala ativa (moderador presente)
   │
   ├── moderador sai explicitamente ──────────┐
   │                                           │
   └── moderador fica ausente (>10min,        │
       detectado no heartbeat de outro         ▼
       participante) ─────────────────►  sala com tombstone
                                          (closedAt definido,
                                           GET devolve
                                           ROOM_CLOSED_BY_MODERATOR)
                                                │
                                                │ passados ROOM_CLOSED_TOMBSTONE_MS
                                                │ (proposta: 30s) — mesmo mecanismo
                                                │ de expiração lazy já existente
                                                ▼
                                          sala inexistente
                                          (GET devolve ROOM_NOT_FOUND,
                                           igual a uma sala expirada
                                           por inatividade geral)
```

```
sala ativa (com N participantes)
   │
   ├── participante comum sai/fica ausente ──► sala ativa (N-1 participantes)
   │                                            [inalterado — comportamento já
   │                                             existente]
   │
   └── moderador remove um participante ───────► sala ativa (N-1 participantes)
        (mesmo efeito de "participante comum      [o participante removido some
         sai", mas acionado por outra pessoa]      da lista para todos; seu voto
                                                    em andamento, se houver, é
                                                    descartado — mesma regra já
                                                    aplicada a qualquer remoção]
```

## Erros (contrato HTTP, `my-api`)

Novo código, na mesma tabela de erros já documentada em
`specs/003-integracao-backend-real/contracts/api-contract.md`:

| `code` | Status HTTP | Quando |
|---|---|---|
| `ROOM_CLOSED_BY_MODERATOR` | 410 (Gone) | `GET` de uma sala dentro da janela de tombstone (decisão 4) — a sala existiu e foi encerrada porque o moderador saiu/ficou ausente, ainda não passou tempo suficiente para virar o `ROOM_NOT_FOUND` genérico. |

Ver `contracts/api-contract.md` desta feature para o formato completo e os
endpoints afetados.

## Frontend (`pokerflow`) — sem novo estado persistido

Nenhum campo novo em `src/types/room.ts` além do código de erro acima no
union `RoomClientErrorCode`. "Fui removido pelo moderador" (User Story 3) é
**derivado**, não armazenado: comparação, a cada leitura, entre o
`participantId` salvo localmente (`useModerator`/identidade da sala) e a
lista `room.participants` recebida — ver decisão 5 do `research.md`.
