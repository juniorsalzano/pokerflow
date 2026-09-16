---
description: "Lista de tarefas para a feature Higiene de Sessão da Sala"
---

# Tarefas: Higiene de Sessão da Sala

**Entrada**: Documentos de design de `specs/005-higiene-sessao-sala/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md, quickstart.md — e as features 001-004/003, já implementadas e em produção.

**Testes**: incluídos para toda mudança de lógica core (Princípio V/VI da constitution, não-negociável) — encerrar sala, remover participante como moderador. UI pura (mensagens, telas) recebe teste leve, como já é a convenção do projeto.

**Organização**: tarefas agrupadas por história de usuário (spec.md). Esta feature toca **dois repositórios**: `pokerflow` (este repositório — frontend) e `my-api` (`/home/junior/projetos/my-api` — backend, repositório separado, sem `.specify/` próprio). Nos caminhos abaixo, `my-api/...` sempre se refere a esse segundo repositório.

## Formato: `[ID] [P?] [História?] Descrição com caminho de arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1/US2/US3/US4]**: história de usuário correspondente (spec.md)

## Fase 1: Setup

Nenhuma tarefa nesta fase — a feature não introduz dependência nova, variável
de ambiente nova, nem configuração de build/lint nova em nenhum dos dois
repositórios (`plan.md`, Technical Context).

---

## Fase 2: Fundação (Bloqueia Todas as Histórias)

Nenhuma tarefa bloqueante compartilhada — as quatro histórias desta feature
são independentes entre si e não compartilham nenhuma infraestrutura nova
(cada uma introduz só o que usa: US1 introduz o campo/tombstone de sala
encerrada, US3 introduz a autorização de remoção por outra pessoa; US2 e US4
são só cliente). **Atenção**: US1, US2 e US3 tocam o mesmo arquivo
`pokerflow/src/services/http/httpRoomClient.ts` — não são bloqueantes uma da
outra, mas não dá pra implementá-las em paralelo sem conflito de merge nesse
arquivo específico (ver Dependências no fim deste documento).

**Checkpoint**: sem fundação a esperar — as histórias podem começar direto,
respeitando a ressalva de arquivo compartilhado acima.

---

## Fase 3: História de Usuário 1 - Sala é encerrada quando o moderador sai ou some (Prioridade: P1) 🎯 MVP

**Objetivo**: sair explicitamente sendo o moderador, ou ficar ausente além da
janela de tolerância de presença já existente (10min), encerra a sala
inteira — nunca mais deixa uma sala sem ninguém capaz de revelar/resetar.
Quem ainda estiver com a sala aberta vê uma mensagem específica, distinta da
genérica de "sala não encontrada/expirada".

**Teste Independente**: criar uma sala com um moderador e outro participante;
sair da sala pelo botão sendo o moderador e confirmar que a sala deixa de
existir para o outro participante, com mensagem específica. Repetir
simulando ausência do moderador (sem heartbeat) além dos 10 minutos.

### Testes para História 1

- [X] T001 [P] [US1] Teste unitário Jest de `leaveRoom` (nova função, domain) em `my-api/src/planning-poker/domain/room.spec.ts`: participante comum saindo continua só sendo removido de `participants`/`round.votes` (regressão); o moderador saindo (`participantId === room.moderatorId`) devolve `null` (sinal de encerrar a sala); token ausente/incorreto continua lançando `NOT_AUTHORIZED` antes de qualquer remoção
- [X] T002 [P] [US1] Teste unitário Jest de `materializeAbsent` estendido em `my-api/src/planning-poker/domain/room.spec.ts`: ausência de participante comum continua com o comportamento já existente (regressão); ausência do moderador entre os removidos devolve `null` em vez de uma sala sem moderador; nenhum ausente devolve a mesma referência recebida (regressão, já testado hoje — confirmar que continua valendo)
- [X] T003 [P] [US1] Teste e2e em `my-api/test/planning-poker.e2e-spec.ts`: `DELETE .../participants/:moderatorId?token=<tokenDoModerador>` — confirmar que um `GET` imediatamente depois devolve `410` `ROOM_CLOSED_BY_MODERATOR`; um `GET` depois de passada a janela de tombstone (`ROOM_CLOSED_TOMBSTONE_MS`, simulado ajustando `closedAt` direto via repositório no teste, mesma técnica já usada para simular expiração/ausência em T025/T027b da spec 003) devolve `404` `ROOM_NOT_FOUND`
- [X] T004 [P] [US1] Teste e2e em `my-api/test/planning-poker.e2e-spec.ts`: simular ausência do moderador por mais de 10 minutos (mesma técnica de T027b da spec 003, ajustando `lastPresenceAt` dele) e confirmar que a próxima ação de heartbeat/leitura com lock de **outro** participante ativo dispara `materializeAbsent`, encerrando a sala (mesmo efeito de tombstone de T003)
- [X] T005 [P] [US1] Teste e2e em `my-api/test/planning-poker.e2e-spec.ts`: participante comum saindo explicitamente ou ficando ausente continua só sendo removido — a sala permanece acessível (`GET` normal, sem `ROOM_CLOSED_BY_MODERATOR`) para os demais (regressão explícita de FR-004)
- [X] T005a [P] [US1] **Teste de regressão explícito, decisão confirmada com o usuário** (spec.md, Edge Cases): teste e2e em `my-api/test/planning-poker.e2e-spec.ts` simulando o moderador ausente por **menos** de 10 minutos (`lastPresenceAt` recente, não expirado) e confirmando que `materializeAbsent`/`withRoom` **não** o remove nem encerra a sala — um `GET`/heartbeat dele nesse meio tempo continua devolvendo o mesmo `moderatorId`, sala intacta, exatamente como já acontece hoje em produção (spec 003, US3). Este teste existe especificamente para impedir que a implementação de T008 regrida esse comportamento já validado

### Implementação da História 1

- [X] T006 [US1] Adicionar `ROOM_CLOSED_BY_MODERATOR` ao union `RoomClientErrorCode` em `my-api/src/planning-poker/domain/room-client-error.ts` e em `pokerflow/src/types/room.ts` (mesmo código nos dois lados, como os demais)
- [X] T007 [US1] Em `my-api/src/planning-poker/domain/room.ts`: adicionar `closedAt?: number` a `InternalRoom`; constante `ROOM_CLOSED_TOMBSTONE_MS = 30_000` (research.md, decisão 4); implementar `leaveRoom(room, participantId, token, now)` — valida token via `checkToken` existente; se `participantId === room.moderatorId`, devolve `null`; senão, mesmo comportamento de `removeParticipant` hoje (depende de T001)
- [X] T008 [US1] Em `my-api/src/planning-poker/domain/room.ts`: mudar a assinatura de `materializeAbsent` para devolver `InternalRoom | null` — se `room.moderatorId` estiver entre os participantes **ausentes há mais de `PRESENCE_LIMIT_MS`** (não antes disso — ver T005a), devolve `null` em vez da sala sem moderador; comportamento inalterado nos demais casos (depende de T002, T005a)
- [X] T009 [US1] Adicionar coluna `closed_at` (`timestamptz`, nullable) à entidade `Room` em `my-api/src/planning-poker/room.entity.ts` e ao mapeamento `toDomain`/`toEntity` em `my-api/src/planning-poker/planning-poker.repository.ts` (depende de T007)
- [X] T010 [US1] Estender `PlanningPokerRepository.read()` (`my-api/src/planning-poker/planning-poker.repository.ts`) para, se a linha lida tiver `closedAt` definido e dentro de `ROOM_CLOSED_TOMBSTONE_MS`, lançar `RoomClientError('ROOM_CLOSED_BY_MODERATOR', ...)` em vez de devolver a sala normalmente; passada a janela, tratar como já trata hoje uma sala expirada (`isExpired`) — remove a linha e devolve `null` (depende de T009)
- [X] T011 [US1] Estender `PlanningPokerRepository.withRoom()` (mesmo arquivo) no ponto onde `materializeAbsent` já é chamado (research.md, decisão 3): se o retorno for `null`, persistir a sala com `closedAt = now` (tombstone) em vez de aplicar a mutação pedida, e devolver esse estado de "encerrada" para quem chamou tratar como sala inexistente para efeitos da operação em curso (depende de T008, T009)
- [X] T012 [US1] Atualizar `PlanningPokerService.leaveRoom` (`my-api/src/planning-poker/planning-poker.service.ts`) para chamar `leaveRoom` (T007) em vez de `removeParticipant` diretamente; quando o domínio devolver `null` (moderador saindo), persistir o tombstone (`closedAt = now`) em vez de apagar a linha imediatamente — mesma técnica de T011, aplicada no caminho de saída explícita (depende de T007, T011)
- [X] T013 [US1] Mapear `ROOM_CLOSED_BY_MODERATOR` para status `410` em `PlanningPokerExceptionFilter` (`my-api/src/planning-poker/planning-poker.exception-filter.ts`), com a mensagem "A sala foi encerrada porque o moderador saiu." (contracts/api-contract.md) (depende de T006)
- [X] T014 [US1] Em `pokerflow/src/services/http/httpRoomClient.ts`: `fetchRoom`/`getRoom` propagam `ROOM_CLOSED_BY_MODERATOR` como `RoomClientError` distinto (hoje só `ROOM_NOT_FOUND` vira `null` silenciosamente — este novo código não deve cair nesse mesmo tratamento) (depende de T006)
- [X] T015 [US1] Em `pokerflow/src/pages/RoomPage.tsx`: tratar `RoomClientError` com `code === "ROOM_CLOSED_BY_MODERATOR"` vindo do polling (`subscribeToRoom`) mostrando uma tela específica de "a sala foi encerrada porque o moderador saiu" — mensagem direta, sem tom de piada (CLAUDE.md, Identidade Visual) — distinta da tela já existente de "sala não encontrada/expirada" (depende de T014)
- [X] T016 [P] [US1] Testes unitários Vitest: `httpRoomClient.ts` reconhece `ROOM_CLOSED_BY_MODERATOR` como `RoomClientError` (não `null`) em `pokerflow/tests/unit/httpRoomClient.test.ts`; `RoomPage` renderiza a tela específica de sala encerrada pelo moderador (fake timer/polling mockado) em `pokerflow/tests/unit/RoomPage.test.tsx` (depende de T014, T015)

**Checkpoint**: História 1 funcional — nenhuma sala fica sem moderador capaz de revelar/resetar; quem estiver com a sala aberta é avisado.

---

## Fase 4: História de Usuário 2 - Nenhuma ação trava a tela indefinidamente (Prioridade: P2)

**Objetivo**: toda chamada de `httpRoomClient.ts` falha de forma recuperável
se o servidor não responder em 10 segundos (research.md, decisão 1), em vez
de deixar a interface presa em carregamento para sempre.

**Teste Independente**: simular uma chamada que nunca responde e confirmar
que qualquer ação (entrar, votar, revelar, resetar, sair) falha com mensagem
de "tente novamente" dentro de ~10s, liberando o botão, sem precisar de F5.

### Testes para História 2

- [X] T017 [P] [US2] Teste unitário Vitest em `pokerflow/tests/unit/httpRoomClient.test.ts`: `fetch` mockado que nunca resolve — `callApi` rejeita em ~10s (fake timers) com um erro comum (não `RoomClientError`); `fetch` mockado que responde normalmente dentro do tempo não é afetado pelo timeout (regressão)

### Implementação da História 2

- [X] T018 [US2] Em `pokerflow/src/services/http/httpRoomClient.ts`: `callApi` passa a criar um `AbortController`, chamar `fetch` com `signal: controller.signal`, e um `setTimeout(() => controller.abort(), 10_000)` limpo com `clearTimeout` ao resolver/rejeitar; o erro de abort segue propagando como erro comum (já é o comportamento de qualquer falha de `fetch`, sem mudança na distinção `RoomClientError` vs. erro genérico) (depende de T017)

**Checkpoint**: História 2 funcional, independente da História 1 (arquivo compartilhado, mas função/trecho diferente de `callApi`).

---

## Fase 5: História de Usuário 3 - Moderador remove um participante manualmente (Prioridade: P3)

**Objetivo**: o moderador vê, para cada participante (exceto ele mesmo), uma
ação de remoção; ao confirmar, o participante sai da sala para todos —
mesmo efeito de "sair da sala" comum, só acionado por outra pessoa.

**Teste Independente**: com uma sala ativa e ao menos dois participantes além
do moderador, acionar a remoção de um deles pela lista e confirmar que ele
some da sala para todos, inclusive para si mesmo.

### Testes para História 3

- [X] T019 [P] [US3] Teste unitário Jest de `removeParticipantAsModerator` (nova função, domain) em `my-api/src/planning-poker/domain/room.spec.ts`: moderador removendo outro participante funciona e descarta o voto dele em `round.votes` (mesma regra de qualquer remoção); `requesterId` diferente de `room.moderatorId`, ou `requesterToken` não batendo com o token real do moderador, lança `NOT_AUTHORIZED` sem alterar a sala
- [X] T020 [P] [US3] Teste e2e em `my-api/test/planning-poker.e2e-spec.ts`: `DELETE .../participants/:targetId?requesterId=<moderatorId>&requesterToken=<tokenDoModerador>` remove `:targetId`, refletido no próximo `GET`; participante comum tentando remover outro pelo mesmo endpoint (`requesterId` de um não-moderador) recebe `401` `NOT_AUTHORIZED`, sem alterar `participants`

### Implementação da História 3

- [X] T021 [US3] Em `my-api/src/planning-poker/domain/room.ts`: implementar `removeParticipantAsModerator(room, requesterId, requesterToken, targetParticipantId, now)` — valida `requesterId === room.moderatorId` e o token do moderador (reaproveita `checkToken`), remove `targetParticipantId` de `participants` e `round.votes` (depende de T019)
- [X] T022 [US3] Estender `DELETE /planning-poker/rooms/:code/participants/:participantId` em `my-api/src/planning-poker/planning-poker.controller.ts` para aceitar `requesterId`/`requesterToken` opcionais na query (contracts/api-contract.md); `PlanningPokerService.leaveRoom` (`my-api/src/planning-poker/planning-poker.service.ts`) passa a decidir: sem `requesterId` (ou igual ao `:participantId` do path) → chama `leaveRoom` (T007, auto-remoção, pode encerrar a sala se for o moderador); com `requesterId` diferente do alvo → chama `removeParticipantAsModerator` (T021) (depende de T007, T021)
- [X] T023 [US3] Adicionar `kickParticipant(code, targetParticipantId): Promise<void>` à interface `RoomClient` em `pokerflow/src/services/roomClient.ts`; implementar em `pokerflow/src/services/http/httpRoomClient.ts` chamando `DELETE .../participants/:targetParticipantId?requesterId=<meuParticipantId>&requesterToken=<meuToken>` (identidade do moderador lida via `currentIdentity`, já existente no arquivo) (depende de T022)
- [X] T024 [P] [US3] Implementar `kickParticipant` como no-op em `pokerflow/src/services/mock/mockRoomClient.ts` (mock fora de escopo desta feature — plan.md, Estrutura do Projeto — mas a interface `RoomClient` precisa de uma implementação em cada lado para o projeto compilar) (depende de T023)
- [X] T025 [US3] Em `pokerflow/src/components/ParticipantList/`: adicionar ação de remover por participante, visível só quando `isModerator` é verdadeiro e o participante da linha não é o próprio moderador (FR-013); confirmação simples antes de efetivar (FR-012, ex. segundo clique ou diálogo nativo) (depende de T023)
- [X] T026 [US3] Em `pokerflow/src/pages/RoomPage.tsx`: a cada atualização de `room.participants` (polling), comparar com o `participantId` local da identidade salva; se sumiu da lista mas a sala continua existindo (sem erro), mostrar uma tela específica de "você foi removido da sala" (FR-015), distinta de "sala não encontrada/expirada" (research.md, decisão 5 — comparação inteiramente client-side, sem mudança de contrato) (depende de T023)
- [X] T027 [P] [US3] Testes: unitário Vitest de `kickParticipant` em `httpRoomClient.ts` (`pokerflow/tests/unit/httpRoomClient.test.ts`); componente de `ParticipantList` (ação só visível ao moderador, nunca na própria linha, exige confirmação) em `pokerflow/tests/unit/ParticipantList.test.tsx`; detecção de "fui removido" em `RoomPage` em `pokerflow/tests/unit/RoomPage.test.tsx` (depende de T024, T025, T026)

**Checkpoint**: História 3 funcional, independente das Histórias 1/2 (mesmo endpoint `DELETE` de US1, mas ramo de código adicional, sem alterar o comportamento de auto-remoção já existente/testado em US1).

---

## Fase 6: História de Usuário 4 - Mensagem clara no nome duplicado (Prioridade: P4)

**Objetivo**: a mensagem de `DUPLICATE_NAME` ao entrar numa sala orienta a
pessoa a considerar que pode ser a própria tentativa anterior ainda ativa,
em vez de afirmar categoricamente que é outra pessoa.

**Teste Independente**: tentar entrar numa sala com um nome já em uso e
confirmar que a mensagem sugere aguardar/tentar de novo, sem afirmar que é
necessariamente outra pessoa.

### Implementação da História 4

- [X] T028 [P] [US4] Ajustar a mensagem associada a `DUPLICATE_NAME` no fluxo de entrada (`pokerflow/src/hooks/useJoinRoom.ts` e/ou `pokerflow/src/components/JoinRoomForm/JoinRoomForm.tsx`, conforme onde a mensagem de erro é hoje composta) para orientar considerar a própria tentativa anterior, sugerindo aguardar um pouco e tentar de novo, sem tom de piada (CLAUDE.md, Identidade Visual)
- [X] T029 [P] [US4] Teste unitário Vitest confirmando o novo texto da mensagem em `pokerflow/tests/unit/JoinRoomForm.test.tsx` (ou arquivo equivalente já existente para esse componente/hook)

**Checkpoint**: História 4 funcional, totalmente independente das demais (só texto de mensagem).

---

## Fase Final: Polish & Validação

- [X] T030 [P] Rodar a skill `security-review` sobre o diff completo desta feature, nos dois repositórios (Princípio VI da constitution) — atenção especial à nova via de autorização de `removeParticipantAsModerator` (T021) e ao novo endpoint aceitar `requesterId`/`requesterToken` de terceiros (T022)
- [ ] T031 Validar manualmente os 6 roteiros de `quickstart.md` (sala encerra na saída explícita do moderador; sala encerra por ausência do moderador; participante comum sai/fica ausente sem afetar a sala; ação não trava a tela; mensagem de nome duplicado; moderador remove participante) e registrar o resultado no `ROADMAP.md`, como já é convenção do projeto (depende de T001-T029)

---

## Dependências

- **Fundação**: nenhuma — as quatro histórias podem começar em qualquer ordem.
- **US1 (P1)**: nenhuma dependência de outra história. Recomendada primeiro por ser o bug mais grave já confirmado.
- **US2 (P2)**: nenhuma dependência de outra história.
- **US3 (P3)**: depende, na prática, de T007 (função `leaveRoom` de US1) para o dispatch em T022 — implementar depois de US1, ou coordenar os dois `PlanningPokerService.leaveRoom`/controller juntos se forem feitos em paralelo por pessoas diferentes.
- **US4 (P4)**: nenhuma dependência de outra história.
- **Arquivo compartilhado**: `pokerflow/src/services/http/httpRoomClient.ts` é tocado por US1 (T014), US2 (T018) e US3 (T023) — mesma ressalva da Fase 2: histórias logicamente independentes, mas não dá pra implementá-las ao mesmo tempo por pessoas/branches diferentes sem conflito de merge nesse arquivo. `my-api/.../planning-poker.service.ts` e `.controller.ts` têm a mesma ressalva entre US1 (T012) e US3 (T022).
- **Polish**: depende de todas as histórias que forem incluídas no escopo da entrega.

## Estratégia de Implementação

**MVP = só História 1** (T001-T016): já resolve o bug mais grave relatado
(sala sem moderador fica inutilizável) e é entregável/testável sozinha.
Histórias 2, 3 e 4 podem entrar em entregas incrementais separadas, na ordem
de prioridade da spec, sem depender umas das outras (exceto a coordenação de
arquivo compartilhado com US1 observada acima).

## Exemplo de execução em paralelo (dentro de uma história)

Dentro da História 1, os testes T001-T005 são `[P]` entre si (arquivos
diferentes ou trechos independentes do mesmo arquivo de teste, sem
dependência entre eles) e podem ser escritos em paralelo antes da
implementação (T006 em diante). Entre histórias diferentes, só US1+US2,
US1+US4, US2+US3, US2+US4 e US3+US4 são seguras para trabalho realmente
simultâneo por pessoas diferentes — qualquer combinação com US1+US3 esbarra
na dependência de T007 anotada acima.
