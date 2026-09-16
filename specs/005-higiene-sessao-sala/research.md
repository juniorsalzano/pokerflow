# Research: Higiene de Sessão da Sala

Seis decisões técnicas, cada uma resolvendo um "NEEDS CLARIFICATION" implícito
do Technical Context do `plan.md`. Nenhuma exige serviço novo, dependência
nova ou rota HTTP nova — todas reaproveitam mecanismos já existentes em
`my-api` (heartbeat, expiração lazy, padrão de autorização por token).

## 1. Timeout de ação no cliente (FR-006/FR-007, SC-002)

**Decisão**: `callApi` (`httpRoomClient.ts`) passa a usar `AbortController`
com um timeout fixo de **10 segundos** por chamada. Ao estourar, a chamada
rejeita com um erro genérico (mesmo tratamento que já existe hoje para
qualquer falha de rede — vira mensagem "não foi possível completar, tente
novamente", não um `RoomClientError` de negócio). Sem retry automático: só
libera a interface para uma nova tentativa manual, como pedido pela spec.

**Rationale**: cold start de função serverless no plano gratuito da Vercel
tipicamente resolve em poucos segundos; 10s é folga suficiente para não gerar
falso positivo num pico de latência comum, mas curto o bastante para não
deixar a pessoa esperando sem explicação. É o mesmo número usado como
referência em todo o resto do produto quando um "tempo curto" é necessário
sem virar detalhe de infraestrutura.

**Alternativas consideradas**:
- 5s — rejeitado: risco maior de falso positivo justamente no caso mais
  comum (cold start), que é o motivo real do bug relatado.
- Retry automático com backoff — rejeitado: a spec pede só liberar a UI para
  tentativa manual (FR-007), não resiliência automática; adicionar retry
  seria escopo não pedido (Princípio I).
- Timeout configurável por variável de ambiente — rejeitado: não há hoje
  nenhum outro parâmetro de comportamento configurado assim no
  `httpRoomClient.ts`; um valor fixo já resolve o problema relatado.

## 2. Encerrar a sala quando o moderador sai explicitamente

**Decisão**: o domínio de `my-api` ganha uma função `leaveRoom(room,
participantId, token)` (substituindo a chamada direta a `removeParticipant`
no service de saída) que: valida o token como hoje; se `participantId ===
room.moderatorId`, devolve um sinal de "encerrar a sala" (ver decisão 4); caso
contrário, mantém o comportamento atual (remove só esse participante). Nenhum
endpoint novo — o mesmo `DELETE /planning-poker/rooms/:code/participants/:id`
passa a ter esse efeito adicional quando o alvo é o moderador.

**Rationale**: menor mudança de superfície de API possível; a saída explícita
já é a mesma ação para qualquer participante hoje, só o efeito no domínio
muda conforme quem está saindo.

**Alternativas consideradas**:
- Rota dedicada `POST .../end` para o moderador encerrar a sala
  explicitamente — rejeitada: redundante, "sair sendo moderador" já expressa
  a mesma intenção sem exigir uma ação nova na UI.

## 3. Encerrar a sala quando o moderador fica ausente (heartbeat)

**Decisão**: `materializeAbsent` passa a devolver `InternalRoom | null` (hoje
devolve sempre `InternalRoom`, retornando a mesma referência quando nada
muda). Continua removendo participantes comuns ausentes do jeito que já
funciona; se o `moderatorId` estiver entre os ausentes, devolve `null` em vez
de uma sala sem moderador. `planning-poker.repository.ts` (`withRoom`), que já
distingue "sala não mudou" (mesma referência) de "sala mudou" (referência
nova) nesse ponto, passa a tratar `null` como "encerrar a sala" (mesmo
caminho que já existe para sala expirada por inatividade, alguns parágrafos
acima no mesmo método).

**Rationale**: reaproveita a leitura com lock (`SELECT ... FOR UPDATE`) que já
existe nesse trecho de `withRoom` — nenhuma consulta ou transação nova.

**Alternativas consideradas**: nenhuma — é a extensão mais direta do
mecanismo já existente, sem outra abordagem plausível dentro do mesmo
orçamento de complexidade.

## 4. Mensagem distinta de "sala encerrada pelo moderador" (FR-005)

**Decisão**: ao encerrar a sala pelos caminhos das decisões 2/3, em vez de um
`DELETE` imediato da linha, `my-api` grava um estado transitório
("tombstone") na mesma linha: um campo `closedAt` (timestamp) substitui o
conteúdo normal da sala por, no mínimo, o suficiente para o servidor
reconhecer esse estado. Enquanto `agora - closedAt` for menor que uma janela
curta nova (`ROOM_CLOSED_TOMBSTONE_MS`, proposta: 30 segundos — bem maior que
o intervalo de polling de leitura de 2s, então qualquer cliente com a sala
aberta certamente vê o estado antes dele sumir), `GET` devolve um erro
dedicado `ROOM_CLOSED_BY_MODERATOR` em vez do estado normal da sala. Passada
essa janela, o mesmo mecanismo de expiração lazy que já existe hoje
(`isExpired`, checado tanto em `read()` quanto em `withRoom()`) remove a
linha de vez, e qualquer acesso tardio cai no `ROOM_NOT_FOUND` genérico de
sempre — comportamento inalterado para quem chega depois da janela.

**Rationale**: cumpre FR-005 (mensagem específica, distinta da genérica) sem
introduzir histórico permanente — a janela do tombstone (segundos) é uma
fração pequena da própria janela de tolerância de presença (10min), e
ínfima perto do ciclo de vida normal de uma sala (4h). Não é um registro:
depois de expirar, a linha desaparece do mesmo jeito que qualquer sala
expirada, sem deixar rastro consultável.

**Alternativas consideradas**:
- `DELETE` imediato, sem tombstone — rejeitada: não cumpre FR-005 (o cliente
  não teria como distinguir "moderador saiu" de "expirou/nunca existiu").
- Guardar um registro permanente/histórico de salas encerradas — rejeitada:
  viola o Princípio IV (salas não viram registro persistente).
- Inferir no frontend ("todo ROOM_NOT_FOUND repentino após uma sessão ativa é
  porque o moderador saiu") — rejeitada: impreciso, mostraria a mensagem
  errada para o caso genuíno de expiração por inatividade geral, que
  continua existindo e não tem relação com o moderador.

## 5. "Você foi removido da sala" (participante kickado, FR-015)

**Decisão**: nenhuma mudança de contrato de rede. O `GET` da sala já devolve
a lista atual de `participants` a cada ciclo de polling (2s). O frontend
(`httpRoomClient.ts`/`RoomPage.tsx`) já tem a própria identidade local
(`participantId` salvo via `useModerator`/`useJoinRoom`). Quando o próprio
`participantId` deixa de aparecer em `room.participants` mas a sala continua
existindo (sem erro), o frontend interpreta isso como "fui removido" e mostra
a mensagem específica — comparação feita inteiramente no cliente, sem
depender de nenhum estado novo no servidor.

**Rationale**: o dado necessário já está sendo entregue a cada leitura; criar
um código de erro dedicado exigiria o `GET` falhar para o requisitante
removido, o que hoje nunca acontece (`participantId`/`token` inválidos só
fazem `meuVoto` ser omitido, nunca erro) — mudar isso quebraria o
comportamento documentado do polling anônimo/sem token, fora do escopo desta
feature.

**Alternativas consideradas**:
- Código de erro dedicado no `GET` quando o `participantId` do requisitante
  não existir mais na sala — rejeitada: exigiria redefinir o contrato atual
  de "token ausente/inválido = omite `meuVoto`, nunca erro", usado desde a
  feature 003, sem necessidade real (o dado já chega de outra forma).

## 6. Remoção de participante pelo moderador — autorização (FR-009/FR-010/FR-013)

**Decisão**: estender `DELETE /planning-poker/rooms/:code/participants/:id`
(mesma rota da saída explícita) para aceitar, opcionalmente, dois parâmetros
novos de query representando quem está *pedindo* a remoção quando for
diferente de quem está *sendo* removido: `requesterId` e `requesterToken`.
Quando ausentes, o comportamento é idêntico ao de hoje (auto-remoção — o
`token` da query precisa bater com o `:id` do path). Quando presentes e
diferentes do `:id` do path, o domínio exige que `requesterId ===
room.moderatorId` e que `requesterToken` bata com o token real do moderador —
mesmo padrão de autorização já revisado em `reveal`/`reset`
(`MODERATOR_ONLY`/`NOT_AUTHORIZED`).

**Rationale**: reaproveita rota, formato de erro e o padrão de autorização já
existentes; nenhum conceito novo de credencial é introduzido.

**Alternativas consideradas**:
- Rota dedicada `DELETE .../participants/:id/kick` — rejeitada: duplicaria
  semântica e formato de erro sem necessidade real, só para diferenciar
  "quem está removendo" — algo que dois parâmetros de query opcionais já
  resolvem.
- Exigir corpo (`body`) em vez de query num `DELETE` — rejeitada: a rota já
  usa query para o `token` de auto-remoção (`?token=`); manter os dois casos
  na mesma convenção (query) evita inconsistência dentro do mesmo endpoint.

## Fora de escopo (confirmado, não pesquisado)

- Sincronizar `mockRoomClient.ts` (fase mock) com este comportamento — a
  constitution já registra o mock como caminho de rollback, não o caminho
  padrão de produção; manter os dois em paridade a cada feature voltaria a
  exigir esforço duplicado sem valor de produto (Princípio I). Se o mock for
  usado depois desta feature, "sala sem moderador" continua com o
  comportamento antigo (sem encerrar) até uma decisão explícita de trazer o
  mock de volta ao paridade.
- Qualquer forma de eleição/promoção de moderador — decisão de escopo já
  reafirmada na spec.
- Indicador de presença/última atividade na lista de participantes — decisão
  de escopo já reafirmada na spec.
