# Especificação de Feature: Painel Central da Mesa e Revelação de Resultado com Transições

**Feature Branch**: `004-revelacao-resultado`

**Criada em**: 2026-09-15

**Status**: Implementado

**Entrada**: Descrição do usuário: "Melhoria da experiência de revelação de votos na tela da sala (RoomPage). Um novo painel central ('a mesa') passa a existir acima da lista de participantes, que continua em grade/linha como hoje (não em círculo — com muitos participantes um layout circular fica confuso e difícil de ler). Esse painel central troca de conteúdo conforme o momento: durante a votação mostra uma mensagem de status simples; ao clicar em 'Revelar', antes de qualquer carta virar, uma contagem regressiva (3, 2, 1) aparece nele; ao final, as cartas de cada participante viram no lugar, na grade (comportamento equivalente ao já existente na spec 002), com uma textura de verso de carta enquanto ocultas. Pouco depois, essas cartas reveladas se transformam — com uma transição carta a carta, não abrupta — num painel de resultado que ocupa o lugar delas, agrupando os participantes por valor votado (pilha de avatares com iniciais, já que o produto não tem fotos de perfil). Quando o resultado é consenso total, o momento em que o painel de resultado aparece é acompanhado por uma animação curta de confete ('burst'). Ao clicar em 'Resetar', o painel de resultado transiciona de volta para as cartas individuais na grade (carta a carta), e o painel central volta a mostrar o status de votação. Sem mascote/personagem/mensagens decorativas — usa a paleta de cores já definida do PokerFlow. Referências visuais: um gif e alguns prints de outra ferramenta de planning poker, usados só como inspiração de conceito (painel central, contador, verso de carta, confete, resultado agrupado) — não para copiar literalmente cores, mascote ou o exato timing."

**Depende de**: [002-rodada-votacao](../002-rodada-votacao/spec.md) (rodada, votos, revelação individual das cartas, reset e o cálculo de consenso/dispersão já existem antes desta feature — esta feature adiciona um painel central e a transição de revelação em torno desse comportamento já existente, sem redefini-lo)

## Cenários de Usuário e Testing *(obrigatório)*

### História de Usuário 1 - Painel central da mesa como status da rodada (Prioridade: P1)

Acima da grade de participantes (que continua como hoje — lado a lado, não em
círculo, para se manter legível com qualquer número de pessoas), passa a
existir um painel central ("a mesa"). Durante a votação, esse painel mostra
uma mensagem simples de status (ex.: instrução para votar). É a base visual
sobre a qual o contador e o resultado agrupado (histórias seguintes) vão
aparecer.

**Por que essa prioridade**: Sem esse painel central, não existe "onde" o
contador e o resultado agrupado vão aparecer — é a fundação das demais
histórias desta feature.

**Teste Independente**: Pode ser testado abrindo uma sala e conferindo que o
painel central aparece acima da grade de participantes, mostrando uma
mensagem de status durante a votação.

**Cenários de Aceite**:

1. **Dado** uma sala com uma rodada em andamento, **Quando** a tela da sala é
   exibida, **Então** um painel central aparece acima da grade de
   participantes, mostrando uma mensagem de status da votação.
2. **Dado** o painel central e a grade de participantes exibidos, **Quando** a
   tela é vista em mobile (largura estreita), **Então** ambos permanecem
   legíveis e utilizáveis, seguindo os breakpoints responsivos já usados na
   tela da sala.

---

### História de Usuário 2 - Revelar com contador no painel central (Prioridade: P1)

Quando o moderador clica em "Revelar", antes de qualquer carta virar, uma
contagem regressiva curta (3, 2, 1) aparece no painel central. Ao final da
contagem, as cartas de cada participante viram no lugar, na grade, revelando
os valores — o mesmo comportamento de flip individual que já existe hoje
(spec 002), só que agora antecedido pelo contador. Enquanto o voto de um
participante está oculto (já votou, mas ainda não foi revelado), a carta dele
exibe uma textura de verso de carta, reforçando a metáfora de baralho.

**Por que essa prioridade**: É o gatilho de toda a experiência de revelação
desta feature — sem o contador e o flip, as histórias seguintes (resultado
agrupado, confete) não têm o que suceder.

**Teste Independente**: Pode ser testado revelando uma rodada com votos
registrados e conferindo que a contagem regressiva aparece no painel central
antes de qualquer carta virar, e que as cartas só viram depois que a contagem
termina.

**Cenários de Aceite**:

1. **Dado** uma rodada com votos registrados, **Quando** o moderador clica em
   "Revelar", **Então** uma contagem regressiva (3, 2, 1) aparece no painel
   central antes de qualquer carta virar.
2. **Dado** que a contagem regressiva chegou ao fim, **Quando** o "1"
   desaparece, **Então** as cartas de cada participante viram no lugar, na
   grade, revelando os valores.
3. **Dado** um participante com voto registrado antes da revelação, **Quando**
   a carta dele ainda está oculta, **Então** ela exibe uma textura de verso de
   carta (não uma área lisa/vazia).

---

### História de Usuário 3 - Resultado agrupado substitui as cartas reveladas (Prioridade: P2)

Pouco depois das cartas reveladas aparecerem na grade, elas se transformam —
com uma transição carta a carta, não todas de uma vez — num painel de
resultado que ocupa o lugar delas. Esse painel agrupa os participantes por
valor votado: cada participante que votou vira um avatar (círculo com a
inicial do nome) empilhado no grupo do valor que ele escolheu, permitindo ver
rapidamente a distribuição e discutir divergências.

**Por que essa prioridade**: Aprofunda o valor da revelação (História 2) ao
tornar a distribuição dos votos legível de forma agrupada, mas a revelação já
entrega valor sozinha (ver o voto de cada um na própria carta) mesmo sem essa
transformação — por isso fica em P2.

**Teste Independente**: Pode ser testado revelando uma rodada com votos
divergentes e conferindo que, alguns instantes depois do flip individual, as
cartas se transformam no painel agrupado por valor, com os avatares corretos
em cada grupo.

**Cenários de Aceite**:

1. **Dado** cartas reveladas na grade, **Quando** a transição para o resultado
   começa, **Então** as cartas se transformam, uma a uma, num painel de
   resultado que ocupa o lugar delas.
2. **Dado** uma rodada revelada com votos divergentes, **Quando** o painel de
   resultado é exibido, **Então** ele mostra um grupo para cada valor distinto
   votado, com o avatar de cada participante no grupo do valor que escolheu.
3. **Dado** uma rodada revelada em que todos os participantes que votaram
   escolheram o mesmo valor, **Quando** o painel de resultado é exibido,
   **Então** todos os avatares aparecem no mesmo grupo.
4. **Dado** uma rodada revelada em que nenhum participante votou, **Quando** o
   painel de resultado é exibido, **Então** o sistema mostra um estado vazio
   claro (sem grupos vazios ou quebrados).
5. **Dado** uma rodada revelada com participantes que não votaram, **Quando**
   o painel de resultado é exibido, **Então** a quantidade de participantes
   que ficaram de fora da contagem é indicada de forma textual no painel (eles
   não aparecem em nenhum grupo).

---

### História de Usuário 4 - Voltar para uma nova rodada com transição (Prioridade: P2)

Depois de ver o resultado, o moderador clica em "Resetar". O painel de
resultado transiciona de volta para as cartas individuais, na grade (carta a
carta, espelhando a transição da História 3), prontas para uma nova votação,
e o painel central volta a mostrar o status de votação (História 1).

**Por que essa prioridade**: Completa o ciclo visual iniciado nas Histórias 2
e 3. Sem ela, o produto ainda funciona (o reset já limpa os votos hoje), mas a
transição de volta é o que fecha a experiência de forma consistente.

**Teste Independente**: Pode ser testado revelando uma rodada até o painel de
resultado aparecer, clicando em "Resetar" e conferindo que o painel
transiciona de volta para cartas individuais nas posições corretas da grade.

**Cenários de Aceite**:

1. **Dado** um painel de resultado em exibição, **Quando** o moderador clica
   em "Resetar", **Então** o painel transiciona de volta para cartas
   individuais, carta a carta, nas posições dos participantes na grade.
2. **Dado** que o moderador clica em "Resetar" a qualquer momento durante uma
   transição anterior (contagem regressiva, flip, ou transformação para o
   resultado), **Quando** o reset é processado, **Então** a interface se
   recompõe de forma consistente, sem elementos duplicados ou travados na
   tela.
3. **Dado** uma nova rodada após o reset, **Quando** as cartas terminam de
   voltar, **Então** todos os participantes conseguem votar normalmente, sem
   precisar recarregar a página.

---

### História de Usuário 5 - Celebrar o consenso com confete (Prioridade: P3)

Quando a rodada revelada resulta em consenso total (todos os participantes que
votaram escolheram o mesmo valor), o momento em que o painel de resultado
agrupado aparece (História 3) é acompanhado por uma animação curta de confete
("burst") que estoura e desaparece sozinha em poucos segundos, sem exigir
nenhuma ação do usuário.

**Por que essa prioridade**: É um reforço de celebração, não essencial para
comunicar o resultado (já comunicado pelas Histórias 2 e 3) — por isso fica
como incremento de prioridade mais baixa.

**Teste Independente**: Pode ser testado fazendo todos os participantes de uma
sala votarem o mesmo valor e revelando a rodada; a animação de confete deve
aparecer junto com o painel de resultado agrupado e desaparecer sozinha, sem
exigir clique.

**Cenários de Aceite**:

1. **Dado** uma rodada em que todos os participantes que votaram escolheram o
   mesmo valor, **Quando** o painel de resultado agrupado aparece, **Então**
   uma animação de confete do tipo "burst" é exibida no mesmo instante e
   desaparece sozinha em poucos segundos.
2. **Dado** uma rodada com votos divergentes (sem consenso total), **Quando**
   o painel de resultado agrupado aparece, **Então** nenhuma animação de
   confete é exibida.
3. **Dado** uma rodada em que ninguém votou, **Quando** o painel de resultado
   agrupado aparece, **Então** nenhuma animação de confete é exibida.

---

### Edge Cases

- Sala com um único participante (o próprio moderador) que vota sozinho: pelo
  cálculo de consenso já existente, um único voto é tecnicamente um "consenso
  total" — o painel de resultado e o confete (História 5) seguem essa mesma
  definição, sem lógica especial adicional.
- Muitos participantes na grade (sala cheia): a grade deve continuar legível,
  seguindo o mesmo comportamento responsivo já usado hoje (quebra de linha,
  sem sobreposição) — esta feature não muda essa lógica de grade, só adiciona
  o painel central acima dela.
- Revelação sem nenhum voto registrado: a contagem regressiva e o flip
  individual ainda ocorrem normalmente; o painel de resultado agrupado mostra
  um estado vazio, sem grupos vazios e sem confete.
- Reset disparado a qualquer momento de uma transição em andamento (contagem
  regressiva, flip individual, transformação para o resultado, ou
  transformação de volta): a interface deve se recompor de forma consistente,
  sem travar nem duplicar elementos.
- Escala de pontos não numérica (ex.: valores como "?" ou carta de "café"): o
  agrupamento por valor no painel de resultado funciona normalmente,
  independentemente de o valor ser numérico.
- Dois participantes com o mesmo nome (o produto permite nomes duplicados, sem
  contas): o avatar (círculo com inicial) pode ser ambíguo entre os dois — não
  é um problema novo desta feature, já existe hoje nos assentos, e não precisa
  de solução especial aqui.
- Tela estreita (mobile): o painel central, o contador, o flip e o painel de
  resultado continuam legíveis e utilizáveis, seguindo os mesmos breakpoints
  responsivos já usados no restante da tela da sala.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **FR-001**: O sistema DEVE exibir um painel central ("a mesa") acima da
  grade de participantes; os participantes continuam dispostos em grade/linha
  como hoje, não em layout circular.
- **FR-002**: O painel central DEVE funcionar como status da rodada: durante
  a votação exibe uma mensagem simples (ex.: instrução para votar); ao
  revelar, dá lugar à contagem regressiva (FR-004) e, na sequência, ao painel
  de resultado agrupado (FR-006/FR-007); após o reset, volta a mostrar a
  mensagem de status.
- **FR-003**: Enquanto o voto de um participante está oculto (já votou, mas a
  rodada não foi revelada), a carta dele na grade DEVE exibir uma textura de
  verso de carta (padrão, não lisa/vazia), reforçando a metáfora de carta de
  baralho.
- **FR-004**: Ao clicar em "Revelar", o sistema DEVE exibir uma contagem
  regressiva curta (3, 2, 1) no painel central antes de virar qualquer carta.
- **FR-005**: Ao final da contagem regressiva, o sistema DEVE virar as cartas
  de cada participante no lugar, na grade, revelando os valores (mesmo
  comportamento de flip individual já existente, spec 002).
- **FR-006**: Após o flip individual, o sistema DEVE transformar as cartas
  reveladas — com uma transição carta a carta — num painel de resultado que
  ocupa o lugar delas.
- **FR-007**: O painel de resultado DEVE agrupar os participantes que votaram
  por valor distinto votado, exibindo um avatar (círculo com a inicial do
  nome) para cada participante, no grupo do valor que ele escolheu.
- **FR-008**: Quando todos os participantes que votaram escolheram o mesmo
  valor (consenso total, conforme já calculado pela lógica existente de
  resumo da rodada), o sistema DEVE disparar uma animação de confete do tipo
  "burst" (curta, de poucos segundos, sem confete contínuo) no mesmo instante
  em que o painel de resultado agrupado aparece.
- **FR-009**: Quando não há consenso total — incluindo o caso de nenhum voto
  registrado — o sistema DEVE exibir o painel de resultado sem disparar a
  animação de confete.
- **FR-010**: O painel central, o contador e o painel de resultado DEVEM usar
  exclusivamente a paleta de cores e a tipografia já definidas no PokerFlow,
  sem mascote, personagem ou emoji decorativo — inclusive nos avatares
  (iniciais geradas, não imagens de referências externas).
- **FR-011**: Quando nenhum participante votou até a revelação, o sistema DEVE
  exibir uma mensagem de estado vazio no painel de resultado, em vez de grupos
  vazios.
- **FR-012**: Quando há participantes que não votaram até a revelação, o
  painel de resultado DEVE indicar textualmente quantos participantes ficaram
  de fora da contagem (preservando a informação hoje exibida como "Não votou"
  em cada assento); esses participantes não aparecem em nenhum grupo.
- **FR-013**: Ao clicar em "Resetar", o sistema DEVE transformar o painel de
  resultado de volta em cartas individuais, carta a carta, nas posições dos
  participantes na grade, e o painel central DEVE voltar a mostrar a mensagem
  de status da votação.
- **FR-014**: As transições (contagem regressiva, flip individual,
  transformação para o resultado, transformação de volta) DEVEM permanecer
  consistentes mesmo que o usuário dispare o reset a qualquer momento durante
  uma transição anterior, sem travar a interface nem deixar elementos
  duplicados.
- **FR-015**: O painel central, a grade de participantes e o painel de
  resultado DEVEM permanecer legíveis e utilizáveis em telas estreitas
  (mobile), seguindo os breakpoints responsivos já usados no restante da tela
  da sala.
- **FR-016**: Apenas o moderador DEVE continuar sendo quem aciona Revelar e
  Resetar — esta feature não altera as regras de permissão já existentes.

### Key Entities

- **Distribuição de Resultado**: agrupamento (derivado, não persistido) dos
  votos de uma rodada revelada por valor distinto — para cada valor, a lista
  de participantes (nome/inicial) que o escolheram — insumo direto dos grupos
  de avatares do painel de resultado.

## Success Criteria *(obrigatório)*

### Measurable Outcomes

- **SC-001**: Um participante consegue identificar o resultado da rodada
  (consenso ou a distribuição dos votos) olhando para o painel de resultado
  agrupado, sem precisar ler texto pequeno na topbar.
- **SC-002**: Em 100% das rodadas com consenso total, a animação de confete
  aparece junto com o painel de resultado e desaparece sozinha, sem exigir
  nenhuma ação do usuário para removê-la da tela.
- **SC-003**: Em 100% dos resets, os participantes veem as cartas voltarem às
  posições da grade e conseguem votar na nova rodada sem precisar recarregar a
  página.
- **SC-004**: O painel central, o contador, o flip e o painel de resultado
  funcionam sem quebra de layout em qualquer largura de tela e quantidade de
  participantes já suportadas pelo produto hoje (desktop e mobile).

## Assumptions

- Os participantes continuam em grade/linha (como hoje), não em layout
  circular — decisão tomada explicitamente para manter a legibilidade com
  qualquer número de participantes, inclusive salas cheias. O que esta feature
  adiciona é um painel central acima da grade, não uma reorganização espacial
  dos assentos.
- O flip individual das cartas ao revelar (spec 002) não é substituído por
  esta feature — continua acontecendo normalmente, apenas antecedido pela
  contagem regressiva e seguido pela transformação para o painel agrupado.
- "Consenso total" usa exatamente a mesma definição já implementada na lógica
  de resumo da rodada existente (`resumoRodada`) — esta feature consome esse
  resultado, não redefine o que conta como consenso.
- Não há estatísticas numéricas adicionais (média, mediana) no escopo desta
  feature — o painel de resultado se limita ao agrupamento de participantes
  por valor votado.
- Os avatares são gerados localmente (círculo com iniciais do nome), não são
  fotos reais — o PokerFlow não tem contas nem fotos de perfil, por design.
- O confete é uma exceção pontual e deliberada à diretriz geral de "sem
  excesso de animação/confete" da Identidade Visual do produto, limitada a
  este momento específico (consenso total na revelação) — não é uma mudança
  geral de tom do produto.
- A lógica de cálculo de consenso/dispersão em `roomStore.ts` não é alterada
  por esta feature.
- As referências visuais (gif e prints de outra ferramenta de planning poker)
  usadas nesta conversa são só inspiração de conceito — painel central,
  contador, verso de carta, resultado agrupado — não para reprodução literal
  (sem mascote/robozinho, sem cores da referência, sem layout circular). A
  escolha de como implementar as transições fica a critério do
  `/speckit-plan`, respeitando a identidade visual do PokerFlow.
- Fora de escopo: mudanças nas regras de negócio de votação/revelação/reset
  (permissões, sigilo do voto, etc.), já definidas na spec
  [002-rodada-votacao](../002-rodada-votacao/spec.md) e na constitution.
