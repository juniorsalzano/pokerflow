# Pesquisa Técnica: Rodada de Votação

## 1. Efeito de "virar carta"

**Decisão**: CSS 3D puro — container com `perspective`, a carta com
`transform-style: preserve-3d`, duas faces (`backface-visibility: hidden`)
sobrepostas, e uma classe que alterna `rotateY(0deg)` ↔ `rotateY(180deg)`
conforme o estado (votou/revelado). No reveal de todos os participantes, cada
`SeatCard` recebe um `transition-delay` calculado por índice (`~60ms * i`)
para um efeito de sequência, não simultâneo.

**Motivo**: entrega o efeito pedido (identidade visual "divertido, mas
profissional" — ver CLAUDE.md) sem adicionar dependência nova. Zero custo de
bundle, roda bem em qualquer navegador moderno.

**Alternativas consideradas**: Framer Motion — rejeitado por YAGNI; o efeito
necessário (flip + stagger) é simples o suficiente para CSS puro, e uma
biblioteca de animação inteira seria desproporcional ao ganho.

## 2. Cálculo de consenso/dispersão (para o resumo pós-revelação)

**Decisão**:
- Se todos os votos (comparados como string) forem idênticos → **Consenso**,
  mostrando o valor.
- Senão, se a escala for `fibonacci` ou `sequencial` **e** todos os votos
  computados forem numéricos (ignorando `?` e `☕`, que não entram na conta):
  **Dispersão**, mostrando a faixa mínimo–máximo.
- Senão (escala `camisetas`, ou mistura com `?`/`☕`): **Sem consenso**, sem
  tentar calcular uma faixa numérica — apenas indica que os votos variam.

**Motivo**: cobre o caso comum (visto no canvas de design, "Dispersão: 5–8")
sem inventar uma métrica sem sentido para escalas não-numéricas.

## 3. Tratamento visual do valor "☕" (pausa/incerteza na escala Fibonacci)

**Decisão**: o dado continua sendo a string `"☕"` (já definida em
`ESCALAS_PONTOS` desde a feature 001), mas a camada de apresentação
(`HandOfCards`/`SeatCard`) renderiza esse valor específico com um ícone SVG
de xícara (stroke-based, mesmo estilo dos demais ícones do app) em vez do
caractere emoji — consistente com a Identidade Visual (CLAUDE.md: "sem
emoji decorativo"). O valor `"?"` continua como texto simples (não é emoji).

## 4. Validação de moderador nas ações de revelar/resetar

**Decisão**: `roomStore.revelar`/`roomStore.resetar` recebem o
`participanteId` de quem chamou e lançam `RoomClientError("APENAS_MODERADOR",
...)` se `sala.moderadorId !== participanteId`. A UI também esconde os
botões para quem não é moderador (defesa em profundidade, mesmo sem
enforcement de servidor ainda nesta fase).

## 5. Sigilo do voto na fase mock (ligado à nota do Princípio II, v1.4.1)

**Decisão**: `Sala.rodada.votos` continua sendo um único objeto no mock
(mesmo modelo de dados de 001), sem uma projeção por participante. A UI é
responsável por nunca renderizar `votos[outroParticipanteId]` antes do
estado da rodada ser `'revelada'` — isso satisfaz o comportamento visível
pelo usuário (FR-003), mas não impede uma inspeção técnica do
`localStorage`. Ver a nota do Princípio II na constitution para o porquê
essa limitação foi aceita conscientemente nesta fase.

**Alternativa considerada e rejeitada**: fazer `obterSala`/`assinarSala`
exigirem o `participanteId` de quem pergunta, para devolver uma versão do
objeto com os votos alheios redigidos. Rejeitada por adicionar complexidade
real ao contrato (toda leitura passaria a exigir identidade) para uma
garantia que já foi formalmente aceita como best-effort nesta fase — melhor
reavaliar isso quando a API real for desenhada.
