# Modelo de Dados: Rodada de Votação

Estende o modelo de `Sala` já existente (feature 001) com um novo campo.

## Rodada (novo — parte de `Sala.rodada`)

| Campo | Tipo | Regras |
|---|---|---|
| `estado` | `'votando' \| 'revelada'` | Começa em `'votando'` quando a sala é criada (001) e sempre que é resetada. |
| `votos` | `Record<participanteId, string>` | Cada valor DEVE pertencer a `ESCALAS_PONTOS[sala.escalaPontos]` — FR-002 do contrato (ver `contracts/api-contract.md`). Votar de novo sobrescreve o valor anterior do mesmo participante (FR-005 da spec). |

`Sala` (001) ganha o campo `rodada: Rodada`, presente desde a criação.

## Regras de validação (derivadas dos Requisitos Funcionais)

- **FR-002/FR-003**: `votar` só é aceito se `rodada.estado === 'votando'` e o
  valor pertence à escala da sala; senão, erro (`RODADA_JA_REVELADA` ou
  `VALOR_INVALIDO`).
- **FR-006/FR-010**: `revelar` e `resetar` só são aceitos se
  `participanteId` chamador === `sala.moderadorId`; senão,
  `RoomClientError("APENAS_MODERADOR", ...)`.
- **FR-012**: `resetar` é aceito em qualquer `estado` (antes ou depois de
  revelada).

## Ciclo de vida da Rodada

```
'votando' --votar (qualquer participante, quantas vezes quiser)--> 'votando'
'votando' --revelar (moderador)--> 'revelada'
'revelada' --resetar (moderador)--> 'votando' (votos limpos)
'votando'  --resetar (moderador)--> 'votando' (votos limpos, idempotente)
```

## Resumo pós-revelação (derivado, não persistido)

Calculado sob demanda a partir de `sala.participantes` + `rodada.votos` no
momento da renderização (não é um campo armazenado). **Importante**: o
cálculo DEVE iterar sobre `sala.participantes` (a lista atual), nunca sobre
`Object.keys(rodada.votos)` diretamente — isso garante que o voto de um
participante que já saiu da sala não conte mais em nenhum resultado (Caso de
Borda da spec: "o voto de quem sai deixa de contar").

- `votaram: number` — quantos participantes ATUAIS têm entrada em `votos`.
- `naoVotaram: Participante[]` — participantes ATUAIS sem entrada em `votos`.
- `resultado: { tipo: 'consenso'; valor: string } | { tipo: 'dispersao'; min: string; max: string } | { tipo: 'sem-consenso' }`
  — calculado só sobre os votos de participantes atuais; ver `research.md`
  §2 para a regra de cálculo.

## Sigilo (ligado ao Princípio II, nota da fase mock)

`rodada.votos` é um único objeto acessível a todo o código do app (mesmo
modelo de armazenamento de 001). A camada de apresentação (não o modelo de
dados) é responsável por nunca exibir `votos[id]` de outro participante
antes de `estado === 'revelada'`. Ver `research.md` §5 e a nota do
Princípio II na constitution para o porquê disso é aceito nesta fase.
