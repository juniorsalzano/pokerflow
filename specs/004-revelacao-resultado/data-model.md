# Fase 1 — Modelo de Dados: Painel Central da Mesa e Revelação de Resultado

Esta feature não persiste nenhum dado novo (não adiciona colunas, tabelas nem
campos em `Sala`/`Rodada` — ver constitution, Princípio IV, e spec 003). Os
"entities" abaixo são todos **derivados em memória, no frontend**, a partir
de `Sala`/`Rodada`/`resumoRodada` já existentes (`src/types/room.ts`,
`src/services/mock/roomStore.ts`).

## FaseRevelacao (estado de apresentação, não persistido)

Estado local de UI que orquestra as transições (research.md §3). Não é
enviado ao servidor nem lido de `Sala`.

```ts
type FaseRevelacao =
  | "votando"    // rodada.estado === "votando"; painel central mostra status
  | "contagem"   // transição: contador 3-2-1 no painel central
  | "virando"    // transição: flip individual das cartas de assento (spec 002)
  | "saindo"     // transição: "Suas cartas" (mão) some em cascata
  | "resultado"  // painel de resultado agrupado visível NO LUGAR de "Suas
                 // cartas" (não dentro do painel central — ver nota abaixo)
  | "voltando";  // transição de reset: resultado -> "Suas cartas" de volta
```

**Importante — onde cada coisa aparece** (correção de um desenho anterior
desta feature, que colocava o resultado dentro do painel central — errado):

- O **painel central** ("a mesa") só mostra status/contagem regressiva
  (`"votando"`/`"contagem"`/`"virando"`/`"saindo"` → texto "Revelando…").
  Nunca mostra o resultado agrupado.
- A **grade de assentos** (um cartão pequeno por participante, ao redor da
  mesa) fica **sempre visível**, em todas as fases — não sai de cena. Só vira
  no lugar (`"virando"`) para mostrar o valor votado; nunca é removida da
  tela.
- **"Suas cartas"** (a mão de cartas clicável, onde o próprio participante
  vota) é o que **sai de cena** na fase `"saindo"` e dá lugar ao **painel de
  resultado agrupado** na fase `"resultado"` — é aqui, não no painel
  central, que a transição "cartas saem, resultado ocupa o lugar delas"
  (FR-006) acontece. Na fase `"voltando"`, o resultado sai e "Suas cartas"
  volta a aparecer no mesmo lugar.

Por isso `"virando"` escalona pela quantidade de **participantes**
(`ATRASO_ENTRE_CARTAS_MS` × índice do assento), enquanto `"saindo"`/
`"voltando"` escalonam pela quantidade de **valores da escala de pontos**
(cartas da mão) — são grades diferentes, com contagens diferentes.

**Transições válidas**:

| De | Para | Gatilho |
|----|------|---------|
| `votando` | `contagem` | `rodada.estado` muda para `"revelada"` (moderador revelou) |
| `contagem` | `virando` | contador chega a "1" e termina (timer local) |
| `virando` | `saindo` | flip individual dos assentos termina (timer local) |
| `saindo` | `resultado` | saída em cascata de "Suas cartas" termina (timer local) |
| `resultado` | `voltando` | `rodada.estado` volta para `"votando"` (moderador resetou) |
| `voltando` | `votando` | entrada em cascata de "Suas cartas" termina (timer local) |
| *qualquer fase* | `voltando` | reset disparado a meio de qualquer transição (FR-014) |

**Regra de segurança (Princípio II, inalterado)**: em nenhuma fase antes de
`resultado` (ou antes de `rodada.estado === "revelada"`) o componente pode
ler `rodada.votos[idDeOutroParticipante]` — essa regra já existe em
`SeatCard` hoje e não muda.

## DistribuicaoResultado (derivado, não persistido)

Agrupamento dos votos de uma rodada revelada por valor distinto — insumo do
painel de resultado (FR-007).

```ts
interface GrupoDeValor {
  valor: string;                 // um dos valores da escala de pontos da sala
  participantes: Participante[]; // quem escolheu esse valor
}

interface DistribuicaoResultado {
  grupos: GrupoDeValor[];       // um grupo por valor distinto votado, não-vazio
  naoVotaram: Participante[];   // reaproveita ResumoRodada.naoVotaram
}
```

**Derivação** (função pura, testável — `agruparPorValor(sala: Sala): DistribuicaoResultado`):
para cada participante com voto em `rodada.votos`, agrupa por valor;
`naoVotaram` é `sala.participantes` menos quem está em `rodada.votos` (mesmo
cálculo já usado por `resumoRodada` em `roomStore.ts` — reaproveitado, não
duplicado).

**Validação**: só é chamada quando `rodada.estado === "revelada"` (mesma
guarda que hoje protege `resumoRodada`); grupos com zero participantes não
são criados (edge case "ninguém votou" produz `grupos: []`, tratado como
estado vazio pela UI, FR-011).

## AvatarParticipante (derivado, não persistido)

```ts
interface AvatarParticipante {
  iniciais: string; // ver research.md §5
  cor: string;       // token de cor já existente na paleta do PokerFlow
}
```

**Derivação**: função pura `avatarDe(participante: Participante): AvatarParticipante`,
determinística a partir de `participante.nome`/`participante.id` (mesmo
participante sempre produz o mesmo avatar dentro de uma sessão).

## Sem mudanças em entidades existentes

- `Participante`, `Rodada`, `Sala`, `ResumoRodada` (`src/types/room.ts`):
  nenhum campo novo. Esta feature só consome esses tipos.
- `resumoRodada()` (`src/services/mock/roomStore.ts`): assinatura e
  comportamento inalterados; `DistribuicaoResultado` é calculada por uma nova
  função ao lado dela, reaproveitando a mesma fonte de dados
  (`sala.rodada.votos`, `sala.participantes`).
