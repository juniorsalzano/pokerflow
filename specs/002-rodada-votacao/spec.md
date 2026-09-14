# Especificação de Feature: Rodada de Votação

**Branch da Feature**: `002-rodada-votacao`

**Criada em**: 2026-09-14

**Status**: Rascunho

**Entrada**: Descrição do usuário: "Rodada de votação de Planning Poker: dentro de uma sala já criada (spec 001), os participantes veem no topo da tela um baralho de cartas com os valores da escala de pontos escolhida na criação da sala. Ao clicar em uma carta, o jogador vota — a carta vira com um efeito visual, e o valor votado fica oculto para os demais participantes até que o moderador (dono da sala) clique em 'Revelar'. Antes da revelação, o jogador pode clicar em outra carta para trocar seu voto livremente. Depois que o moderador revela, os votos de todos ficam visíveis e travados (não podem mais ser alterados) até a rodada ser resetada. Há um botão 'Resetar' que limpa os votos de todos e prepara a sala para uma nova rodada de votação com os mesmos participantes."

**Depende de**: [001-criar-entrar-sala](../001-criar-entrar-sala/spec.md) (sala, participantes, moderador e escala de pontos já existem antes desta feature)

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 - Votar em uma rodada (Prioridade: P1)

Dentro de uma sala, cada participante vê um conjunto de cartas com os valores da
escala de pontos da sala. Ao clicar em uma carta, o participante registra seu voto;
a carta escolhida dá um retorno visual imediato (efeito de virar), mas o valor
votado permanece oculto para os demais até a revelação. O participante pode mudar
de ideia e clicar em outra carta quantas vezes quiser antes da revelação.

**Por que essa prioridade**: É o núcleo do produto — sem poder votar de forma
oculta, a ferramenta não cumpre seu propósito (evitar viés de ancoragem).

**Teste Independente**: Pode ser testado com dois participantes na mesma sala:
um vota, o outro deve ver apenas a indicação de "já votou" sem o valor, e o
primeiro deve poder trocar de carta livremente antes de qualquer revelação.

**Cenários de Aceite**:

1. **Dado** um participante em uma sala com uma rodada em aberto, **Quando** ele
   clica em uma carta, **Então** seu voto é registrado, ele próprio continua
   vendo qual valor escolheu a qualquer momento antes da revelação, e nenhum
   outro participante consegue ver esse valor.
2. **Dado** um participante que já votou e a rodada ainda não foi revelada,
   **Quando** ele clica em outra carta, **Então** seu voto anterior é substituído
   pelo novo, permanecendo oculto para os demais.
3. **Dado** um participante que ainda não votou, **Quando** outro participante
   vota, **Então** ele vê uma indicação de que aquele colega já votou, sem ver o
   valor.

---

### História de Usuário 2 - Revelar os votos da rodada (Prioridade: P1)

O moderador da sala decide encerrar a fase de votação e clica em "Revelar". A
partir daí, o valor votado por cada participante fica visível para todos, e
nenhum voto pode mais ser alterado até a rodada ser resetada.

**Por que essa prioridade**: É o momento que entrega o valor da dinâmica —
comparar as estimativas do time simultaneamente. Sem revelar, a votação oculta
não gera nenhum resultado útil.

**Teste Independente**: Pode ser testado com participantes já tendo votado;
o moderador clica em revelar e verifica que os valores aparecem para todos e que
tentativas de trocar o voto depois disso são bloqueadas.

**Cenários de Aceite**:

1. **Dado** uma rodada com um ou mais participantes já tendo votado, **Quando**
   o moderador clica em "Revelar", **Então** o valor votado por cada participante
   que votou fica visível para todos os presentes na sala.
2. **Dado** uma rodada revelada, **Quando** qualquer participante tenta clicar em
   uma carta, **Então** o sistema não permite alterar o voto até a rodada ser
   resetada.
3. **Dado** uma rodada com participantes que não votaram até o momento da
   revelação, **Quando** o moderador revela, **Então** esses participantes
   aparecem claramente marcados como "não votou", sem gerar erro.
4. **Dado** que um participante comum (não moderador) tenta revelar a rodada,
   **Quando** ele aciona a ação, **Então** o sistema não permite, pois apenas o
   moderador pode revelar.

---

### História de Usuário 3 - Resetar a rodada (Prioridade: P2)

Depois de discutir os resultados revelados, o moderador clica em "Resetar" para
limpar todos os votos e iniciar uma nova rodada de votação, mantendo os mesmos
participantes na sala.

**Por que essa prioridade**: Sem reset, a sala só serve para uma única rodada,
mas não bloqueia o valor da História 1 e 2 (que já entregam o ciclo completo de
uma rodada); por isso o reset habilita rodadas seguintes e é P2.

**Teste Independente**: Pode ser testado revelando uma rodada e clicando em
"Resetar"; deve-se verificar que todos os votos somem da tela e uma nova votação
oculta pode começar imediatamente, sem precisar recriar a sala.

**Cenários de Aceite**:

1. **Dado** uma rodada já revelada, **Quando** o moderador clica em "Resetar",
   **Então** todos os votos são limpos, as cartas voltam ao estado não votado
   para todos os participantes, e uma nova rodada de votação oculta começa.
2. **Dado** que um participante comum (não moderador) tenta resetar a rodada,
   **Quando** ele aciona a ação, **Então** o sistema não permite, pois apenas o
   moderador pode resetar.
3. **Dado** uma rodada ainda não revelada (alguns participantes já votaram),
   **Quando** o moderador clica em "Resetar", **Então** o sistema também limpa
   os votos parciais e reinicia a rodada normalmente.

---

### Casos de Borda

- O que acontece se o moderador revelar sem que nenhum participante tenha
  votado? O sistema revela normalmente, mostrando todos os participantes como
  "não votou" — não é um estado de erro.
- O que acontece se um novo participante entrar na sala depois que a rodada já
  foi revelada? Ele entra vendo o resultado já revelado da rodada atual e poderá
  votar normalmente a partir do próximo reset.
- O que acontece se um participante que votou sair da sala antes da revelação?
  Seu voto anterior deixa de contar (participante não está mais presente); ele
  não aparece na lista de votos ao revelar.
- O que acontece se o moderador original sair da sala no meio de uma rodada?
  Está fora do escopo desta feature reatribuir o papel de moderador — isso fica
  para uma spec futura; enquanto isso, as ações de revelar/resetar ficam
  indisponíveis até o moderador retornar (ver Suposições).

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **FR-001**: O sistema DEVE exibir para cada participante um conjunto de cartas
  correspondente à escala de pontos definida na criação da sala.
- **FR-002**: O sistema DEVE permitir que um participante registre seu voto ao
  clicar em uma carta, com retorno visual imediato de que a seleção foi
  registrada.
- **FR-003**: O sistema NÃO DEVE revelar o valor votado por um participante para
  os demais participantes antes da ação de revelar.
- **FR-004**: O sistema DEVE indicar aos demais participantes que um participante
  já votou, sem expor o valor votado, antes da revelação.
- **FR-004a**: O sistema DEVE exibir ao próprio participante, a qualquer momento
  antes ou depois da revelação, qual valor ele votou — o sigilo (FR-003) vale
  apenas em relação aos outros participantes.
- **FR-005**: O sistema DEVE permitir que um participante troque seu voto quantas
  vezes quiser, desde que a rodada ainda não tenha sido revelada.
- **FR-006**: O sistema DEVE permitir a ação de revelar os votos da rodada
  exclusivamente ao moderador da sala.
- **FR-007**: Ao revelar, o sistema DEVE exibir o valor votado por cada
  participante que votou, visível para todos os presentes na sala.
- **FR-008**: Ao revelar, o sistema DEVE indicar claramente quais participantes
  não registraram voto até aquele momento.
- **FR-009**: Após a revelação, o sistema NÃO DEVE permitir que nenhum
  participante altere seu voto até a rodada ser resetada.
- **FR-010**: O sistema DEVE permitir a ação de resetar a rodada exclusivamente
  ao moderador da sala.
- **FR-011**: Ao resetar, o sistema DEVE limpar os votos de todos os
  participantes e retornar a sala ao estado de votação oculta, mantendo os
  mesmos participantes presentes.
- **FR-012**: O sistema DEVE permitir resetar uma rodada tanto antes quanto
  depois de revelada.

### Entidades-Chave

- **Rodada**: Ciclo de votação dentro de uma sala, com estado (votando ou
  revelada) e a coleção de votos dos participantes. É reiniciada pela ação de
  resetar.
- **Voto**: Associação entre um participante e um valor da escala de pontos da
  sala, pertencente à rodada atual. Permanece oculto para os demais até a
  revelação da rodada.

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: Um participante consegue registrar ou trocar seu voto em menos de
  2 segundos após clicar em uma carta.
- **SC-002**: 100% dos votos permanecem ocultos para outros participantes até a
  ação de revelar ser acionada pelo moderador (nenhum vazamento em nenhuma
  circunstância).
- **SC-003**: Após o moderador revelar, todos os participantes veem os votos
  atualizados em até 2 segundos.
- **SC-004**: Um moderador consegue iniciar uma nova rodada (resetar) e o time
  volta a poder votar em menos de 2 segundos, sem precisar recriar a sala.
- **SC-005**: Um participante consegue votar, trocar de voto e ver a revelação
  usando apenas um smartphone, com as cartas grandes o suficiente para tocar
  sem errar (sem depender de zoom).

## Suposições

- Revelar não exige que todos os participantes tenham votado; o moderador pode
  revelar a qualquer momento, e quem não votou aparece marcado como tal.
- A reatribuição do papel de moderador quando o moderador original sai da sala
  está fora do escopo desta feature — assume-se que fica para uma spec futura
  (ex.: "transferência de moderação"); aqui, apenas o moderador original pode
  revelar/resetar.
- O efeito visual de "virar carta" é uma diretriz de experiência do usuário a ser
  detalhada no planejamento técnico (`/speckit-plan`); esta spec exige apenas que
  haja retorno visual imediato ao votar, sem prescrever a implementação exata.
- Esta feature assume no máximo o número de participantes já coberto pela spec
  001 (~15 pessoas por sala), sem necessidade de otimizações adicionais.
