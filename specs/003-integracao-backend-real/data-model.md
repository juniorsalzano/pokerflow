# Fase 1 — Modelo de Dados: Integração com Backend Real

Mesmas entidades de negócio já definidas em `specs/001-criar-entrar-sala/data-model.md`
e `specs/002-rodada-votacao/data-model.md` — esta feature só muda **onde**
elas vivem (Postgres via TypeORM, no `my-api`) e **como** são lidas/escritas
(transação com lock de linha), não o formato/regras em si. Ver `research.md`
§1-3 para as decisões por trás deste desenho.

## Identidade e credencial (revisado — achado D1 do `/speckit-analyze`)

Cada objeto dentro de `participantes` (tanto no armazenamento interno
quanto no domínio) ganha um campo a mais em relação a `Participante` do
frontend (`pokerflow/src/types/room.ts`):

| Campo | Presente em... | Regras |
|---|---|---|
| `token` | Só na representação **interna** (linha do banco / domínio do `my-api`) | String aleatória gerada no mesmo estilo de `participanteId` (imprevisível). Prova de posse daquele `participanteId`, devolvida **uma única vez** na resposta de `criarSala`/`entrarNaSala`, para o dono. |
| `ultimaPresencaEm` | Só na representação **interna** | Timestamp. Definido em `entrouEm` na criação/entrada; atualizado a cada `POST /rooms/:codigo/heartbeat` (FR-010). Usado para remover o participante (FR-011, `research.md` §14) — nunca serializado nas respostas HTTP. |

**Regra inegociável**: `token` NUNCA aparece em nenhuma resposta de
`Sala`/`participantes[]`/`GET obterSala` — só é usado internamente pelo
`PlanningPokerService` para validar `votar`/`sair`/`revelar`/`resetar` e
para decidir se inclui `meuVoto` num `GET` (research.md §6). A camada de
serialização HTTP (`contracts/api-contract.md`) projeta cada participante
sem esse campo antes de responder — ver `research.md` §6 para o racional
completo (por que a versão anterior desta spec, sem `token`, violava o
Princípio II).

`localStorage["pokerflow:eu:<codigo>"]` (chave já definida em
`specs/001-criar-entrar-sala/data-model.md`) ganha o campo `token` junto de
`participanteId`/`ehModerador` — extensão aditiva, não quebra o formato
original.

## Tabela `planning_poker_rooms`

Uma linha = uma sala inteira (participantes e rodada incluídos). Nome da
tabela prefixado (`planning_poker_`) para deixar claro, dentro do banco
compartilhado do `my-api`, que essas linhas pertencem ao módulo do
PokerFlow — não ao site de currículo.

| Coluna | Tipo (Postgres) | Corresponde a (spec 001/002) | Regras |
|---|---|---|---|
| `codigo` | `varchar(8)` **PK** | `Sala.codigo` | 7 caracteres, alfabeto sem caracteres ambíguos (mesmo gerador do mock — `research.md` §2). |
| `nome` | `varchar(60)` | `Sala.nome` | Sanitizado e validado antes de gravar (mesma lógica de `validation.ts`). |
| `escala_pontos` | `varchar(20)` | `Sala.escalaPontos` | Um de `'fibonacci' \| 'sequencial' \| 'camisetas'`. Imutável após criação. |
| `moderador_id` | `varchar(36)` | `Sala.moderadorId` | UUID do participante criador. |
| `participantes` | `jsonb` | `Sala.participantes` (`Participante[]`) | Array de `{ id, nome, ehModerador, entrouEm, token, ultimaPresencaEm }` — **`token` e `ultimaPresencaEm` são internos, nunca serializados nas respostas HTTP** (ver "Identidade e credencial" acima). |
| `rodada` | `jsonb` | `Sala.rodada` | `{ estado: 'votando' \| 'revelada', votos: Record<participanteId, string> }`. |
| `criada_em` | `timestamptz` | `Sala.criadaEm` | Definido na criação, imutável. |
| `ultima_atividade_em` | `timestamptz` | `Sala.ultimaAtividadeEm` | Atualizado a cada ação (entrar/sair/votar/revelar/resetar); usado na checagem de expiração preguiçosa (`research.md` §4). |

Índice: nenhum adicional além da PK (`codigo`) — não há consulta por
`moderador_id` nem por participante fora do contexto de uma sala já
carregada pelo código.

## Entidade TypeORM (`Room`)

Mapeamento 1:1 com a tabela acima (`@Entity('planning_poker_rooms')`),
seguindo a convenção de nomes já usada em `resume-log.entity.ts` (colunas
`snake_case` no banco, propriedades `camelCase` na classe — padrão do
TypeORM). `participantes` e `rodada` usam `@Column({ type: 'jsonb' })`.

## Regras de validação

Sem mudança em relação a 001/002 — reaplicadas no lado do servidor porque
agora é o servidor, e não mais só o navegador do cliente, quem garante a
regra (Princípio VI):

- Nome de sala: 1-60 caracteres após sanitizar, obrigatório.
- Nome de participante: 1-30 caracteres após sanitizar, obrigatório, único
  (case-insensitive) dentro da sala.
- Valor de voto: precisa pertencer a `ESCALAS_PONTOS[escalaPontos]` da sala.
- Ações de revelar/resetar: `participanteId` do chamador precisa ser
  `moderador_id`.
- Votar: rejeitado se `rodada.estado !== 'votando'`.

**Nova regra (achado D1)**: `votar`, `sair`, `revelar`, `resetar` também
exigem que o `token` recebido bata com o `token` interno do `participanteId`
informado — senão, `NAO_AUTORIZADO`, independente de qualquer outra
validação já passar (ver "Identidade e credencial" acima e `research.md`
§6).

## Ciclo de vida (sem mudança de comportamento, novo mecanismo de expiração)

```
(inexistente) --criar sala--> linha inserida em planning_poker_rooms
Ativa --participante entra/sai/vota/revela/reseta/heartbeat--> UPDATE da linha (lock de linha, research.md §3)
Ativa --leitura/ação: cada participante com ultimaPresencaEm > 10min--> removido do array
  participantes (e de rodada.votos), moderadorId revogado sem reatribuir se era o moderador
  (FR-011, research.md §14) — a sala em si continua ativa
Ativa --leitura/ação após 4h sem nenhuma atividade--> tratada como
  SALA_NAO_ENCONTRADA + linha apagada (DELETE preguiçoso, research.md §4)
```

Os dois mecanismos de expiração (por participante, 10min; por sala inteira,
4h) são independentes: o primeiro esvazia participantes de uma sala que
continua existindo; o segundo descarta a sala inteira. Ambos são checagens
preguiçosas no mesmo ponto de leitura/ação — nenhum job de fundo.

## Resumo pós-revelação

Continua **derivado, não persistido** — calculado em memória a partir de
`participantes` + `rodada.votos` da linha lida, pela mesma função pura
`resumoRodada` portada do mock (`research.md` §10). Nenhuma coluna nova para
isso.

## Sigilo do voto (Princípio II — deixa de ser best-effort)

Diferente da fase mock (nota do Princípio II, v1.4.1), aqui a garantia passa
a ser estrutural: o `planning-poker.service.ts` NUNCA inclui
`rodada.votos[participanteId]` de outro participante no JSON de resposta
antes de `rodada.estado === 'revelada'` — o servidor filtra antes de
serializar, então não há nenhum jeito de um cliente inspecionar rede e ver o
voto alheio cedo, ao contrário do que era tecnicamente possível inspecionando
`localStorage` no mock. Isso só é estrutural de verdade **com** a exigência
de `token` para `meuVoto` (achado D1) — sem ela, bastaria conhecer o
`participanteId` alheio (público, visível a todos na sala) para pedir o
voto dele via `GET`. Ver `contracts/api-contract.md` para o formato exato
da resposta filtrada.
