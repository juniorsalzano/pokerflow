# Especificação de Feature: Criar e Entrar em uma Sala

**Branch da Feature**: `001-criar-entrar-sala`

**Criada em**: 2026-09-14

**Status**: Rascunho

**Entrada**: Descrição do usuário: "Criar e entrar em uma sala de Planning Poker: um usuário cria uma sala (recebe um link/código para compartilhar) e outros participantes entram nessa sala informando apenas um nome, sem necessidade de conta, senha ou e-mail. Isso é a base para as próximas features (votar, revelar, resetar). Na tela de criação há 3 campos: nome da sala, nome de quem está criando (que também entra na sala) e a escala de pontos da rodada (ex.: Fibonacci)."

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 - Criar uma sala (Prioridade: P1)

Um facilitador de refinamento quer iniciar uma sessão de planning poker. Na tela
inicial, ele preenche três campos — nome da sala, seu próprio nome (com o qual
também entrará na sala como participante) e a escala de pontos que será usada na
rodada — e cria a sala, recebendo um link/código único para compartilhar com o
time.

**Por que essa prioridade**: Sem a criação da sala não existe nenhuma outra
funcionalidade do produto. É o ponto de entrada de todo o fluxo.

**Teste Independente**: Pode ser testado sozinho ao acessar a ferramenta,
preencher os três campos, criar a sala e verificar que um link/código único é
gerado, a sala é criada com a escala de pontos escolhida e o criador já está
dentro dela como participante/moderador.

**Cenários de Aceite**:

1. **Dado** que o usuário está na tela inicial, **Quando** ele informa o nome da
   sala, seu nome e escolhe uma escala de pontos, e confirma a criação, **Então**
   o sistema gera um link/código único e leva o usuário para dentro da sala como
   participante (moderador), já com a escala de pontos escolhida associada à sala.
2. **Dado** que uma sala foi criada, **Quando** o link/código é compartilhado,
   **Então** qualquer pessoa que o acesse consegue chegar à tela de entrada daquela
   sala específica.
3. **Dado** que o usuário está na tela inicial, **Quando** ele tenta criar a sala
   sem preencher o nome da sala, seu nome, ou sem escolher uma escala de pontos,
   **Então** o sistema impede a criação e indica quais campos precisam ser
   preenchidos.

---

### História de Usuário 2 - Entrar em uma sala existente (Prioridade: P1)

Um membro do time recebe o link/código da sala, acessa e informa apenas seu nome
para entrar, sem precisar criar conta ou fazer login.

**Por que essa prioridade**: É a segunda metade indispensável do fluxo — uma sala
sem participantes não serve para nada. Junto com a História 1, forma o MVP mínimo
demonstrável.

**Teste Independente**: Pode ser testado sozinho acessando um link/código de sala já
existente, informando um nome e verificando que o participante passa a aparecer na
lista da sala para os demais.

**Cenários de Aceite**:

1. **Dado** um link/código de sala válido, **Quando** um novo participante informa
   um nome e confirma, **Então** ele entra na sala e passa a ser listado para todos
   os demais participantes.
2. **Dado** que um participante já está na sala com um determinado nome, **Quando**
   outra pessoa tenta entrar com esse mesmo nome, **Então** o sistema rejeita a
   entrada e pede que ela escolha um nome diferente.
3. **Dado** um link/código de sala inexistente ou expirado, **Quando** alguém tenta
   acessá-lo, **Então** o sistema informa que a sala não está disponível, sem expor
   detalhes técnicos.

---

### História de Usuário 3 - Sair e ver participantes atualizados (Prioridade: P2)

Participantes entram e saem da sala ao longo da sessão (ex.: fecham a aba, caem a
conexão), e os demais precisam ver a lista de participantes sempre atualizada.

**Por que essa prioridade**: Importante para a experiência da sessão ao vivo, mas a
sala funciona (mesmo que de forma degradada) sem esse refinamento — por isso é P2 e
não P1.

**Teste Independente**: Pode ser testado abrindo a sala em duas sessões, fechando
uma delas e verificando que a lista de participantes se atualiza para quem ficou.

**Cenários de Aceite**:

1. **Dado** dois participantes em uma sala, **Quando** um deles sai de propósito
   (ação explícita de sair — ainda não implementada; hoje só existe a sala
   expirar por inatividade), **Então** o outro participante vê a lista de
   participantes atualizada em tempo real, sem precisar recarregar a página.

> **Nota (2026-09-14)**: fechar a aba (ou perder conexão) deliberadamente
> **não** remove mais o participante na hora — ver FR-010 e a User Story 3
> de `specs/003-integracao-backend-real/spec.md`, que exige o oposto
> (reconhecer o mesmo participante/moderador ao reabrir, dentro da janela
> de inatividade). Enquanto isso, alguém que fechou a aba continua
> aparecendo como presente até a sala inteira expirar. A forma correta de
> refletir presença real sem quebrar a reconexão é um mecanismo de
> heartbeat (candidato a spec futura).

---

### Casos de Borda

- O que acontece se o moderador (criador da sala) sair da sala? A sala continua
  ativa para os demais participantes até expirar por inatividade (ver FR-008); a
  ferramenta não impede a sessão de continuar sem o moderador original.
- O que acontece se alguém tentar criar uma sala sem conexão com o servidor
  (falha de rede)? O sistema deve exibir uma mensagem de erro e permitir tentar
  novamente, sem gerar uma sala "fantasma".
- O que acontece se dois participantes tentarem entrar com o mesmo nome
  exatamente ao mesmo tempo? Apenas o primeiro pedido processado pelo servidor
  deve ser aceito; o segundo recebe a rejeição de nome duplicado (FR-006).
- O que acontece se o moderador recarregar a página (F5), ou fechar a aba e
  voltar depois pelo link da sala, sem sair da sala? Ele continua
  reconhecido como moderador da mesma sala (ver FR-010), sem precisar
  recriar a sala ou perder o controle de revelar/resetar.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **FR-001**: O sistema DEVE permitir que qualquer usuário crie uma nova sala sem
  necessidade de cadastro, login, senha ou e-mail, informando: nome da sala, seu
  próprio nome de exibição e a escala de pontos da rodada.
- **FR-002**: Ao criar uma sala, o sistema DEVE gerar um link ou código único que
  identifique aquela sala especificamente.
- **FR-002a**: O sistema DEVE oferecer um conjunto de escalas de pontos
  pré-definidas para o criador escolher ao criar a sala (ver Suposições para a
  lista padrão), sem permitir escala customizada nesta feature.
- **FR-002b**: O sistema DEVE associar a escala de pontos escolhida à sala,
  disponibilizando-a para as features de votação (specs futuras).
- **FR-003**: O sistema DEVE permitir que qualquer pessoa com o link/código de uma
  sala válida entre nela informando apenas um nome de exibição.
- **FR-004**: O sistema NÃO DEVE exigir conta, senha ou e-mail para entrar em uma
  sala existente.
- **FR-005**: O sistema DEVE marcar o criador da sala como moderador da sessão,
  distinguindo-o dos demais participantes.
- **FR-006**: O sistema DEVE rejeitar a entrada de um participante cujo nome já
  esteja em uso por outro participante ativo na mesma sala, solicitando um nome
  diferente.
- **FR-007**: O sistema DEVE exibir a lista de participantes da sala atualizada em
  tempo real para todos os presentes conforme pessoas entram ou saem.
- **FR-008**: O sistema DEVE encerrar/descartar uma sala automaticamente após um
  período de inatividade (sem nenhuma ação de nenhum participante), independente
  de haver ou não conexões abertas.
- **FR-009**: O sistema DEVE informar de forma clara quando um link/código de sala
  não corresponde a nenhuma sala ativa (inexistente ou já expirada).
- **FR-010**: O sistema DEVE manter o reconhecimento de um participante (e,
  se aplicável, seu papel de moderador) na mesma sala tanto após recarregar
  a página (F5) quanto após fechar a aba e abrir de novo pelo link da sala,
  sem exigir que ele entre novamente ou perca a capacidade de revelar/
  resetar.
- **FR-011**: A interface DEVE ser utilizável em telas de smartphone (layout
  responsivo), já que participantes frequentemente entram pelo celular durante
  a call do time.

### Entidades-Chave

- **Sala**: Sessão de planning poker identificada por um link/código único; possui
  um nome, um moderador (o criador), uma lista de participantes e uma escala de
  pontos escolhida na criação. Existe apenas enquanto ativa; não é persistida
  além do ciclo de vida da sessão.
- **Participante**: Pessoa presente em uma sala, identificada por um nome de
  exibição único dentro daquela sala. Pode ser o moderador ou um participante
  comum.

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: Um usuário consegue criar uma sala e obter o link/código para
  compartilhar em menos de 10 segundos a partir do acesso à ferramenta.
- **SC-002**: Um participante com o link/código em mãos consegue entrar na sala e
  ver os demais participantes em menos de 15 segundos.
- **SC-003**: 95% dos participantes que tentam entrar com um link/código válido e
  nome disponível conseguem entrar na sala com sucesso na primeira tentativa.
- **SC-004**: A lista de participantes reflete entradas e saídas para os demais
  presentes em até 3 segundos após o evento.
- **SC-005**: Um participante consegue criar ou entrar em uma sala e ver a
  lista de participantes usando apenas um smartphone, sem necessidade de zoom
  ou rolagem horizontal.

## Suposições

- As escalas de pontos pré-definidas oferecidas na criação são: Fibonacci
  modificado (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕), Sequencial (1 a 10) e Camisetas
  (PP, P, M, G, GG). A definição exata pode ser refinada no planejamento técnico.
- O período de inatividade que leva ao encerramento automático de uma sala foi
  definido em 4 horas durante o planejamento técnico (`/speckit-plan` →
  `research.md`) — não é uma decisão de negócio crítica para esta spec.
- Não há limite de participantes por sala definido nesta feature; assume-se um
  número típico de um time (até ~15 pessoas) sem necessidade de otimização
  específica para grandes volumes.
- O nome do participante é apenas um identificador de exibição em texto livre,
  sem validação de unicidade global — só precisa ser único dentro da mesma sala
  (FR-006).
- Esta feature cobre apenas criar/entrar/listar participantes; votação, revelação
  e reset de rodada são cobertos por specs futuras.
