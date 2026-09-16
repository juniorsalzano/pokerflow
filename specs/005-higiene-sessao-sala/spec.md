# Feature Specification: Higiene de Sessão da Sala

**Feature Branch**: `005-higiene-sessao-sala`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Higiene de sessão da sala (sala sem moderador, timeout de rede no join, remoção manual de participante) — cobre quatro gaps reais encontrados em teste com usuários de verdade: (1) sala fica inutilizável quando o moderador sai ou fica ausente, porque o papel não é reatribuído e ninguém mais consegue revelar/resetar; (2) ações contra a API real podem travar a tela indefinidamente quando o servidor não responde, sem timeout no cliente; (3) a mensagem de nome duplicado é enganosa quando quem 'já existe' é a própria tentativa anterior da pessoa, travada por perda de resposta; (4) o moderador precisa conseguir remover manualmente um participante da sala, como saída imediata para o mesmo tipo de situação que o timeout de presença resolveria sozinho em até 10 minutos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sala é encerrada quando o moderador sai ou some (Priority: P1)

Um moderador cria uma sala e conduz uma rodada de Planning Poker com o time.
Em algum momento ele sai da sala (de propósito, clicando em "sair") ou some sem
avisar (fecha a aba, perde conexão, o notebook trava). Hoje a sala continua
existindo sem ninguém capaz de revelar ou resetar a rodada, e o time fica
travado sem saber o que aconteceu nem o que fazer — só descobrem depois de um
tempo, sem nenhuma indicação clara. Com esta mudança, a sala é encerrada nesse
exato momento, e quem ainda está com ela aberta vê uma mensagem clara
explicando o que aconteceu.

**Why this priority**: É o bug mais grave já confirmado em uso real — deixa a
sala completamente inutilizável para o restante do time, sem nenhuma forma de
recuperação a não ser esperar a sala expirar por inatividade geral (até 4h) ou
criar uma sala nova do zero.

**Independent Test**: Criar uma sala com um moderador e pelo menos um outro
participante; sair da sala pelo botão de "sair" sendo o moderador e confirmar
que a sala deixa de existir para o participante restante, com uma mensagem
específica. Repetir simulando ausência do moderador (sem sinal de presença)
além do limite já em vigor e confirmar o mesmo resultado.

**Acceptance Scenarios**:

1. **Given** uma sala ativa com um moderador e outros participantes, **When**
   o moderador clica em "sair da sala", **Then** a sala inteira deixa de
   existir e os demais participantes, ao terem a tela atualizada, veem uma
   mensagem específica informando que a sala foi encerrada porque o moderador
   saiu — não a mensagem genérica de "sala não encontrada/expirada".
2. **Given** uma sala ativa, **When** o moderador fica sem enviar sinal de
   presença além do limite de tolerância já em vigor no produto, **Then** a
   sala inteira é encerrada no mesmo momento em que essa ausência é
   detectada, com a mesma mensagem específica para quem ainda estiver com a
   sala aberta.
3. **Given** uma sala ativa, **When** um participante comum (não moderador)
   sai ou fica ausente pelos mesmos caminhos, **Then** apenas ele é removido
   da lista de participantes e a sala continua funcionando normalmente para
   os demais — comportamento inalterado em relação ao que já existe hoje.
4. **Given** uma sala encerrada por saída/ausência do moderador, **When**
   qualquer pessoa tenta agir nela (votar, entrar, revelar), **Then** o papel
   de moderador nunca é reatribuído a outro participante — a sala
   simplesmente deixa de existir.

---

### User Story 2 - Ações na sala nunca travam a tela indefinidamente (Priority: P2)

Um participante tenta entrar na sala, votar, revelar ou resetar uma rodada, e
a resposta do servidor demora demais ou nunca chega (rede instável,
instabilidade momentânea do serviço). Hoje a tela fica presa no estado de
carregamento para sempre, sem nenhuma mensagem de erro e sem o botão voltar a
ficar disponível — a única saída é recarregar a página inteira. Com esta
mudança, depois de um tempo curto de espera a ação falha de forma visível,
com uma mensagem de "tente novamente", e a pessoa consegue agir de novo sem
precisar recarregar a página.

**Why this priority**: É o segundo bug mais grave confirmado — impede a
pessoa de sequer entrar na sala, sem alternativa dentro da própria interface,
minando a confiança no produto logo no primeiro uso.

**Independent Test**: Simular uma chamada à API que nunca responde (ex.:
servidor indisponível) e confirmar que qualquer ação (entrar, votar, revelar,
resetar, sair) falha com uma mensagem clara dentro de um tempo curto,
liberando a interface para nova tentativa sem precisar de F5.

**Acceptance Scenarios**:

1. **Given** alguém preenchendo o nome para entrar numa sala, **When** o
   servidor não responde dentro do tempo limite, **Then** a tela sai do
   estado de carregamento, mostra uma mensagem de falha temporária com
   orientação para tentar de novo, e o botão de ação volta a ficar
   disponível.
2. **Given** um participante votando, revelando ou resetando uma rodada,
   **When** a chamada correspondente não recebe resposta a tempo, **Then** o
   mesmo comportamento de falha recuperável se aplica, sem deixar a tela
   presa.

---

### User Story 3 - Moderador remove um participante manualmente (Priority: P3)

Durante uma rodada, o moderador percebe que um participante está com uma
entrada "fantasma" (alguém que teve problema para entrar e aparece
duplicado) ou que alguém saiu da reunião sem avisar e sem sair da sala pela
interface. Em vez de esperar o mecanismo automático de ausência resolver isso
sozinho (o que pode levar alguns minutos), o moderador remove essa pessoa
diretamente pela lista de participantes.

**Why this priority**: É uma melhoria de controle, não a correção de um bug —
complementa a limpeza automática já existente, dando uma saída imediata para
o moderador em vez de depender só do tempo.

**Independent Test**: Com uma sala ativa e ao menos dois participantes além
do moderador, acionar a remoção de um deles pela lista de participantes e
confirmar que ele deixa de aparecer para todos, incluindo para si mesmo caso
ainda esteja com a sala aberta.

**Acceptance Scenarios**:

1. **Given** uma sala ativa com vários participantes, **When** o moderador
   aciona a remoção de um participante específico (que não seja ele mesmo),
   **Then** esse participante some da lista para todos que estiverem com a
   sala aberta, e a sala continua funcionando normalmente para os demais.
2. **Given** a lista de participantes visível ao moderador, **When** ele olha
   para a própria linha na lista, **Then** não existe ação de remoção
   disponível para si mesmo — sair da sala continua sendo feito pelo botão de
   "sair", que encerra a sala inteira (User Story 1).
3. **Given** um participante que acabou de ser removido pelo moderador,
   **When** a tela dele é atualizada, **Then** ele vê uma mensagem específica
   informando que foi removido da sala, distinta da mensagem de "sala não
   encontrada/expirada".
4. **Given** um participante removido, **When** ele quer voltar a participar,
   **Then** ele precisa entrar de novo pela sala usando o link/código, como
   uma pessoa nova.

---

### User Story 4 - Mensagem clara quando "nome duplicado" é a própria tentativa (Priority: P4)

Alguém tenta entrar numa sala, a tela trava (User Story 2) e a pessoa tenta
de novo com o mesmo nome pouco depois. Hoje ela recebe a mensagem "já existe
alguém com esse nome, escolha outro", como se fosse necessariamente outra
pessoa — o que é enganoso e confuso, já que na prática costuma ser a própria
tentativa anterior dela, ainda não removida automaticamente por ausência. Com
esta mudança, a orientação deixa claro que pode ser esse o caso, sugerindo
esperar um pouco e tentar de novo, sem prometer que é sempre esse o motivo
(pode de fato ser outra pessoa com o mesmo nome).

**Why this priority**: É um ajuste de clareza de mensagem, não corrige perda
de dado nem trava nada — reduz confusão pontual, prioridade mais baixa que as
três anteriores.

**Independent Test**: Tentar entrar numa sala com um nome já em uso e
confirmar que a mensagem exibida orienta a pessoa a considerar que pode ser
sua própria tentativa anterior, sugerindo aguardar e tentar de novo, sem
alarmar como se fosse necessariamente um conflito com outra pessoa.

**Acceptance Scenarios**:

1. **Given** uma tentativa de entrar numa sala com um nome já usado por um
   participante ativo, **When** o sistema rejeita por nome duplicado,
   **Then** a mensagem exibida orienta a pessoa a considerar que pode ser sua
   própria tentativa anterior ainda ativa, sugerindo aguardar um pouco e
   tentar de novo, além da opção de usar outro nome.

---

### Edge Cases

- Se o moderador sair no meio de uma rodada com votos já registrados, os
  votos são descartados junto com o encerramento da sala — mesma regra já
  aceita para quando um participante comum sai no meio de uma rodada.
- Se duas pessoas diferentes (não a mesma pessoa) genuinamente quiserem usar
  o mesmo nome ao mesmo tempo, a mensagem da User Story 4 não deve afirmar
  categoricamente que é uma tentativa fantasma própria — é uma sugestão, não
  uma certeza.
- Se o moderador acionar a remoção de um participante que já saiu ou já foi
  removido por outro motivo (ausência, ação em outra aba) um instante antes,
  a ação é tratada como já concluída, sem erro visível para o moderador.
- Se a própria ação de remover um participante sofrer o mesmo tipo de falha
  de rede da User Story 2, vale a mesma regra geral: falha visível e
  recuperável, sem travar a tela do moderador.
- Se o moderador sair da sala exatamente no mesmo instante em que o mecanismo
  automático de ausência também o estaria removendo, o resultado final é o
  mesmo (sala encerrada) — não há necessidade de tratamento especial para
  essa coincidência.
- **Decisão confirmada explicitamente com o usuário**: se o moderador fechar
  a aba (sem clicar em "sair") e voltar a acessar a sala **dentro** da janela
  de tolerância de presença já existente (10 minutos), ele DEVE retomar
  normalmente como moderador, com a sala intacta — nada muda para esse caso,
  é o comportamento já em produção desde a spec 003. FR-002 só encerra a
  sala se essa janela terminar **sem** ele voltar; reconectar a tempo nunca
  aciona o encerramento. Isso não é uma mudança de escopo desta feature — é
  uma garantia que precisa continuar valendo depois dela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao sair explicitamente da sala sendo o moderador, o sistema
  DEVE encerrar a sala inteira imediatamente, não apenas remover o moderador
  da lista de participantes.
- **FR-002**: Quando o moderador ficar ausente (sem sinal de presença) além
  do limite de tolerância já em vigor no produto, o sistema DEVE encerrar a
  sala inteira no mesmo momento em que essa ausência é detectada.
- **FR-003**: Ao encerrar uma sala pelos motivos de FR-001/FR-002, o sistema
  NÃO DEVE reatribuir o papel de moderador a nenhum outro participante.
- **FR-004**: Participantes comuns (não moderador) que saem explicitamente ou
  ficam ausentes continuam sendo apenas removidos da lista de participantes,
  sem afetar a sala nem os demais — comportamento inalterado.
- **FR-005**: Ao ter a tela atualizada depois de uma sala ser encerrada por
  saída/ausência do moderador, cada participante que ainda estava nela DEVE
  ver uma mensagem específica informando que a sala foi encerrada porque o
  moderador saiu, distinta da mensagem usada para sala não encontrada ou
  expirada por inatividade geral.
- **FR-006**: Toda ação que dependa de resposta do servidor (entrar na sala,
  votar, revelar, resetar, sair, sinal de presença) DEVE falhar de forma
  visível e recuperável caso o servidor não responda dentro de um tempo
  limite curto — a interface nunca deve ficar presa esperando indefinidamente
  sem alternativa além de recarregar a página inteira.
- **FR-007**: Quando uma ação falhar por tempo limite (FR-006), o sistema
  DEVE informar isso com uma mensagem de falha temporária e orientação para
  tentar de novo, liberando a interface para uma nova tentativa.
- **FR-008**: Quando a entrada na sala falhar por nome já em uso, o sistema
  DEVE orientar o usuário considerando a possibilidade de ser sua própria
  tentativa anterior ainda ativa, sugerindo aguardar um pouco e tentar de
  novo, sem afirmar categoricamente que é sempre esse o caso.
- **FR-009**: O moderador DEVE poder ver, para cada participante da sala
  exceto ele mesmo, uma ação para removê-lo da sala.
- **FR-010**: O sistema NÃO DEVE permitir que um participante que não seja o
  moderador remova outro participante da sala — essa ação é exclusiva de
  quem exerce o papel de moderador na sala, mesmo que alguém tente acioná-la
  diretamente sem passar pela interface pensada para o moderador.
- **FR-011**: Ao ser acionada pelo moderador, a remoção de um participante
  DEVE ter efeito para todos que estiverem com a sala aberta, incluindo para
  o próprio removido.
- **FR-012**: O sistema DEVE pedir uma confirmação simples antes de efetivar
  a remoção de um participante pelo moderador, para reduzir o risco de
  remoção acidental por clique errado.
- **FR-013**: Um participante removido pelo moderador DEVE precisar entrar de
  novo pelo link/código da sala para voltar a participar — a remoção não é
  reversível automaticamente.
- **FR-014**: O sistema NÃO DEVE oferecer ao moderador uma ação de remoção
  para si mesmo — sair da sala continua sendo feito pela ação de saída
  (FR-001), que encerra a sala inteira.
- **FR-015**: Ao ter a tela atualizada depois de ser removido pelo moderador,
  o participante removido DEVE ver uma mensagem específica informando que
  foi removido da sala, distinta da mensagem de sala não encontrada/expirada.

### Key Entities

- **Sala**: mesma entidade já existente no produto — passa a poder ser
  encerrada explicitamente como consequência da saída/ausência do moderador,
  além da expiração por inatividade geral já existente. Encerrada, deixa de
  existir para qualquer consulta, do mesmo jeito que uma sala expirada.
- **Participante**: mesma entidade já existente — ganha uma via adicional de
  remoção (pelo moderador, além da própria saída e da ausência por
  timeout), e passa a poder ser distinguido, do lado de quem foi removido,
  entre "sala encerrada" e "eu fui removido".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quando o moderador sai ou fica ausente, 100% das salas afetadas
  deixam de estar disponíveis para os demais participantes no momento da
  detecção (saída explícita: na próxima atualização de tela; ausência: no
  mesmo momento em que o limite de tolerância já existente é atingido) — sem
  depender da expiração geral por inatividade (até 4h).
- **SC-002**: Nenhuma ação da interface (entrar, votar, revelar, resetar,
  sair) permanece em estado de carregamento por mais de alguns segundos sem
  se resolver em sucesso ou em uma mensagem de erro recuperável.
- **SC-003**: Um moderador consegue remover um participante indesejado da
  sala em poucos segundos e sem sair da tela da sala, sem precisar esperar o
  mecanismo automático de ausência.
- **SC-004**: Participantes que enfrentam a mensagem de nome duplicado por
  causa da própria tentativa anterior travada entendem, pela mensagem
  exibida, que podem tentar de novo em vez de interpretar como um erro
  definitivo do sistema.

## Assumptions

- O tempo limite curto de FR-006/SC-002 é definido no plano técnico desta
  feature (não nesta especificação) — deve ser curto o suficiente para não
  frustrar quem está esperando, mas tolerante o bastante para não disparar
  falsos positivos em uma inicialização mais lenta do servidor (cold start).
- A janela de tolerância de presença e os demais mecanismos de heartbeat e
  expiração geral de sala já existentes no produto permanecem inalterados;
  esta feature muda apenas a consequência de o ausente/removido ser
  especificamente o moderador, e adiciona a remoção manual.
- "Encerrar a sala" tem o mesmo efeito, do ponto de vista de quem usa o
  produto, de uma sala expirada por inatividade — deixa de existir, sem
  necessidade de manter qualquer registro histórico dela.
- Continua fora de escopo (decisão já tomada e reafirmada aqui): qualquer
  forma de eleição, promoção automática ou transferência do papel de
  moderador para outro participante. Uma sala sem moderador é encerrada, não
  continuada por outra pessoa.
- Não é necessário exibir na interface qualquer indicador de "última
  atividade" ou presença dos participantes para apoiar a decisão do
  moderador de remover alguém — ele decide por julgamento próprio.
- Fora de escopo (avaliado deliberadamente e descartado por ora): eliminar
  por completo a possibilidade de uma tentativa de entrada travada deixar um
  registro fantasma (ex.: via uma chave de idempotência no pedido de
  entrada, permitindo ao cliente recuperar a mesma identidade numa nova
  tentativa). Quem trava no meio da entrada ainda não votou nem agiu como
  aquele participante — o custo real é só precisar reentrar, já coberto por
  FR-006/FR-007/FR-008 e, no limite, pela remoção manual do moderador
  (User Story 3). Candidato a spec própria se esse relato específico
  continuar aparecendo depois que esta feature estiver em produção.
