# Feature Specification: Integração com Backend Real

**Feature Branch**: `003-integracao-backend-real`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Substituir a implementação mockada (localStorage/BroadcastChannel) por uma API real: backend Node.js hospedado como funções serverless na Vercel (free tier, sem WebSocket persistente), implementando os endpoints já desenhados nos contratos de 001 e 002 (criar sala, entrar na sala, obter sala, sair da sala, votar, revelar, resetar). A camada roomClient da UI passa a ter uma implementação http/httpRoomClient.ts que segue o mesmo contrato do mock, sem mudar os componentes. Estado da sala continua efêmero (sem banco de dados por padrão, conforme constitution/CLAUDE.md) — guardado em memória do processo serverless ou storage temporário equivalente. assinarSala deixa de usar BroadcastChannel e passa a fazer polling HTTP periódico contra GET /api/rooms/:codigo."

## Clarifications

### Session 2026-09-14

- Q: Depois que um participante para de mandar sinal de presença (fechou a aba, perdeu conexão), quanto tempo a sala deve esperar antes de tirá-lo da lista de participantes? → A: 10 minutos de ausência; passado esse tempo, a pessoa precisa entrar de novo (novo participanteId). A limpeza pode ser feita por um job dedicado se necessário, não precisa ser só computada na leitura.
- Q: O sinal de presença viaja junto do polling de leitura (GET /rooms/:codigo a cada 2s) ou como uma chamada separada e mais espaçada? → A: Chamada separada, a cada ~30-60s — o polling de leitura (2s) continua só lendo, sem gravar no banco a cada ciclo.
- Q: Quando um participante é removido por 10 minutos de ausência no meio de uma rodada em andamento, o voto que ele já tinha dado é descartado ou fica guardado caso ele volte antes do reset? → A: Descartado — consistente com "sair de propósito", que já descarta o voto hoje; se reconectar depois dos 10 minutos, entra como participante novo e vota de novo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Time real usa a sala entre dispositivos diferentes (Priority: P1)

Um moderador cria uma sala no próprio computador e compartilha o link/código com o
time; cada colega entra a partir do seu próprio dispositivo (notebook, celular),
em redes diferentes. Todos veem os mesmos participantes, votam e veem a
revelação simultânea — sem depender de estarem no mesmo navegador ou
dispositivo, como acontece hoje na fase mockada.

**Why this priority**: É o que torna a ferramenta utilizável de verdade. Hoje
(fase mock) a sincronização só funciona entre abas do mesmo navegador via
localStorage/BroadcastChannel — não serve para um time real, distribuído em
máquinas diferentes. Sem isso, o produto não tem uso prático fora de uma demo.

**Independent Test**: Criar uma sala em um dispositivo/rede e entrar nela a
partir de outro dispositivo/rede diferente usando o código; votar nos dois,
revelar em um e confirmar que o outro também vê o resultado.

**Acceptance Scenarios**:

1. **Given** uma sala criada por um moderador em um dispositivo, **When** outro
   participante entra usando o código a partir de um dispositivo/rede
   diferente, **Then** ambos veem a mesma lista de participantes e o mesmo
   estado da rodada.
2. **Given** dois participantes em dispositivos diferentes votando na mesma
   sala, **When** o moderador revela os votos a partir do seu dispositivo,
   **Then** todos os participantes, independentemente do dispositivo, veem os
   votos revelados em poucos segundos.

---

### User Story 2 - Comportamento já validado continua valendo (Priority: P2)

Todo o comportamento já certificado na fase mock (sigilo do voto até revelar,
isolamento entre salas simultâneas, nome duplicado rejeitado, sala expirada
avisada com clareza, moderador reconhecido após recarregar a página, resetar
rodada) continua funcionando exatamente da mesma forma depois da troca para o
backend real. Do ponto de vista de quem usa a ferramenta, nada muda a não ser
passar a funcionar entre dispositivos diferentes.

**Why this priority**: Trocar o mock pela API real é uma mudança de "motor",
não de comportamento. Regredir qualquer uma dessas regras já certificadas
seria pior do que não ter feito a troca.

**Independent Test**: Repetir os mesmos roteiros de teste (automatizados e
manuais) das features 001/002 — sigilo de voto, isolamento entre salas
simultâneas, nome duplicado, sala expirada, moderador sobrevive a F5, resetar
rodada — agora contra a API real, e confirmar resultado idêntico.

**Acceptance Scenarios**:

1. **Given** uma rodada de votação em andamento, **When** um participante
   consulta o estado da sala antes da revelação, **Then** ele nunca recebe o
   valor votado por outro participante, apenas o fato de que já votou.
2. **Given** duas salas ativas ao mesmo tempo, **When** ações acontecem em uma
   delas (votar, revelar, resetar, entrar, sair), **Then** a outra sala
   permanece com seu próprio estado inalterado.

---

### User Story 3 - Sala sobrevive a uma queda momentânea do moderador (Priority: P3)

Se a conexão de um participante (incluindo o moderador) cair momentaneamente,
ou a aba for fechada e reaberta, a sala continua existindo e ele consegue
voltar a participar sem perder o papel de moderador nem reiniciar a sala,
desde que dentro da janela de tolerância de presença (10 minutos sem sinal —
ver Clarifications).

**Why this priority**: Hoje isso é garantido no mock via armazenamento local
do próprio navegador; no backend real, o estado da sala não pode mais
depender do dispositivo de quem criou — precisa sobreviver de fato do lado do
servidor, senão a sala "morre" se o criador cair.

**Independent Test**: Criar uma sala, derrubar a conexão do moderador (ex.:
fechar a aba), reabrir dentro da janela de tolerância de presença de 10
minutos e confirmar que a sala e o papel de moderador continuam intactos,
inclusive para os demais participantes. Reabrir depois de passados os 10
minutos e confirmar que precisa entrar de novo (novo participanteId, sem
papel de moderador automático).

**Acceptance Scenarios**:

1. **Given** uma sala ativa com participantes votando, **When** o dispositivo
   do moderador fica temporariamente sem conexão, **Then** a sala continua
   acessível e com estado íntegro para os demais participantes.
2. **Given** um moderador que recarrega a página ou reabre a aba dentro da
   janela de tolerância de presença de 10 minutos, **When** ele volta a
   acessar o link, **Then** ele é reconhecido como moderador da mesma sala,
   com o estado atual.

---

### Edge Cases

- O que acontece quando dois participantes votam ao mesmo tempo, no mesmo
  instante (concorrência de escrita)? O último voto recebido pelo servidor
  deve prevalecer, sem erro para nenhum dos dois lados.
- O que acontece se a API estiver momentaneamente indisponível quando alguém
  tenta criar/entrar/votar? A interface deve informar uma falha temporária de
  forma clara, sem travar, permitindo nova tentativa.
- O que acontece com uma sala que ultrapassa o período de inatividade enquanto
  alguém ainda está com a aba aberta olhando para ela? As próximas ações
  dessa pessoa devem falhar com a mesma mensagem de "sala não
  encontrada/expirada" já usada hoje.
- O que acontece se dois moderadores (ou o mesmo moderador em duas abas)
  tentarem revelar/resetar a mesma rodada quase ao mesmo tempo? O resultado
  final deve ser consistente (idempotente) e não deve corromper o estado da
  rodada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor, via rede, todas as operações já definidas
  para a sala e para a rodada de votação (criar sala, entrar na sala,
  consultar sala, sair da sala, votar, revelar, resetar), preservando
  exatamente as mesmas regras de validação e os mesmos erros de negócio já
  estabelecidos nas features 001 e 002.
- **FR-002**: O sistema DEVE permitir que participantes em dispositivos e
  redes diferentes colaborem na mesma sala em tempo quase real, sem depender
  de compartilharem o mesmo navegador ou dispositivo.
- **FR-003**: O sistema DEVE manter o estado de uma sala ativa (participantes,
  papel de moderador, rodada, votos) disponível de forma consistente entre
  requisições subsequentes, mesmo que originadas de processos/instâncias
  diferentes do lado do servidor.
- **FR-004**: O sistema DEVE continuar garantindo o sigilo do voto (Princípio
  II da constitution) também no transporte de rede: o servidor NÃO DEVE
  enviar a nenhum cliente o valor individual votado por outro participante
  antes da revelação da rodada.
- **FR-005**: O sistema DEVE continuar encerrando/descartando automaticamente
  uma sala após o mesmo período de inatividade já definido na fase mock,
  independente de qual participante (incluindo o moderador) esteja com
  conexão ativa no momento.
- **FR-006**: O sistema DEVE atualizar a visão de cada participante (lista de
  participantes, votos registrados, estado da rodada) automaticamente, sem
  exigir que a pessoa recarregue a página manualmente.
- **FR-007**: O sistema DEVE continuar operando inteiramente dentro de opções
  gratuitas de hospedagem/infraestrutura (Princípio IV da constitution) —
  nenhum componente novo introduzido por esta feature pode depender de um
  plano pago.
- **FR-008**: O sistema DEVE continuar reconhecendo um participante como
  moderador da mesma sala após ele recarregar a página ou reabrir a aba,
  desde que ele esteja dentro da janela de tolerância de presença (FR-011;
  preserva FR-010 da feature 001).
- **FR-009**: O sistema DEVE informar de forma clara ao usuário quando uma
  ação falhar por indisponibilidade temporária da rede/servidor,
  distinguindo esse caso do erro de "sala não encontrada".
- **FR-010**: Enquanto estiver com a sala aberta, o cliente DEVE enviar um
  sinal periódico de presença ao servidor (a cada 30-60s), desacoplado do
  polling de leitura do estado da sala (a cada 2s) — o sinal de presença
  não deve gerar escrita no banco na mesma frequência da leitura.
- **FR-011**: O sistema DEVE remover um participante da lista de
  participantes ativos de uma sala (incluindo revogar seu papel de
  moderador, se aplicável) depois de 10 minutos seguidos sem receber seu
  sinal de presença — sem afetar os demais participantes nem a sala em si,
  que continua existindo até seu próprio período de inatividade (FR-005).
  Reconectar dentro desses 10 minutos DEVE restaurar a mesma identidade
  (mesmo participanteId e papel de moderador, se aplicável); depois desse
  prazo, a pessoa precisa entrar de novo como um participante novo. O voto
  já registrado por ela na rodada em andamento (se houver) DEVE ser
  descartado junto da remoção, do mesmo jeito que já acontece ao sair de
  propósito.

### Key Entities

- **Sala**: mesma entidade definida nas features 001/002, agora residindo do
  lado do servidor em vez de apenas no navegador de um participante —
  continua efêmera, vinculada ao ciclo de vida da sessão ativa, sem virar um
  registro permanente.
- **Participante**: mesma entidade das features anteriores; sua ligação com
  uma sala específica passa a ser validada pelo servidor a cada ação, não
  apenas pela memória local do navegador de quem a criou.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dois participantes em redes diferentes conseguem entrar na
  mesma sala usando apenas o código/link, sem nenhuma configuração extra de
  rede da parte deles.
- **SC-002**: Uma mudança de estado da sala (alguém entra, sai, vota, ou o
  moderador revela/reseta) fica visível para os demais participantes em até 5
  segundos, mesmo estando em dispositivos/redes diferentes.
- **SC-003**: 100% dos comportamentos de negócio já cobertos por testes
  automatizados nas features 001 e 002 (sigilo de voto, isolamento entre
  salas, nome duplicado, sala expirada, resetar rodada, moderador após F5)
  continuam passando, sem alteração de expectativa, depois da troca para o
  backend real.
- **SC-004**: Uma falha temporária de rede/servidor ao tentar criar, entrar ou
  votar é comunicada ao usuário de forma clara, e ele consegue tentar
  novamente sem precisar recarregar a página inteira.

## Assumptions

- O comportamento e os contratos (entradas, saídas, códigos de erro) já
  definidos nos contratos da feature 001 e na extensão da feature 002
  continuam valendo como fonte da verdade — esta spec troca o "motor"
  (transporte real em vez de mock local), não o comportamento em si.
- O período de inatividade que encerra uma sala automaticamente é o mesmo já
  definido no planejamento técnico da feature 001 (atualmente 4 horas); não é
  redefinido por esta feature.
- O backend real é implementado no repositório já existente `my-api`
  (NestJS, hospedado na Vercel), como um módulo isolado dedicado ao
  PokerFlow, e não como uma pasta `api/` dentro deste repositório — decisão
  registrada em `.specify/memory/constitution.md` ("Backend real:
  repositório `my-api`"). O fluxo Spec Kit deste documento continua vivendo
  só no repositório do pokerflow; a implementação segue as convenções já
  estabelecidas em `my-api`.
- O estado de sala/rodada/voto é persistido no Postgres já provisionado em
  `my-api` (reaproveitamento de infraestrutura existente, não um banco novo),
  em tabelas isoladas com expiração — exceção consciente à regra padrão de
  "nenhum banco assumido por padrão" do Princípio IV, documentada na
  constitution. Continua sem WebSocket persistente (free tier da Vercel); a
  sincronização usa polling HTTP, com o intervalo exato decidido no
  `/speckit-plan`.
- Esta feature não adiciona retenção de dados após uma sala expirar — nenhum
  histórico, relatório ou exportação é introduzido (mantém o YAGNI do
  Princípio I); linhas expiradas são descartáveis.
- O número de participantes simultâneos por sala segue a mesma suposição já
  registrada na feature 001 (até ~15 pessoas por sala, sem otimização para
  grandes volumes).
