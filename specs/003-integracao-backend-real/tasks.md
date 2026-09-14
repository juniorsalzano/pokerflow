---
description: "Lista de tarefas para a feature Integração com Backend Real"
---

# Tarefas: Integração com Backend Real

**Entrada**: Documentos de design de `specs/003-integracao-backend-real/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md, quickstart.md — e as features 001/002, já implementadas e mescladas em `main`.

**Testes**: incluídos — mesmo padrão de 001/002 (Princípio V/VI da constitution, não-negociável para a lógica core).

**Organização**: tarefas agrupadas por história de usuário (spec.md). Esta feature toca **dois repositórios**: `pokerflow` (este repositório — frontend) e `my-api` (`/home/junior/projetos/my-api` — backend, repositório separado, sem `.specify/` próprio). Nos caminhos abaixo, `my-api/...` sempre se refere a esse segundo repositório.

## Formato: `[ID] [P?] [História?] Descrição com caminho de arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1/US2/US3]**: história de usuário correspondente (spec.md)

## Fase 1: Setup

- [X] T001 Instalar `@nestjs/throttler` em `my-api` (`npm install @nestjs/throttler`) — única dependência nova desta feature (research.md §8)
- [X] T002 [P] Criar `pokerflow/.env.example` documentando `VITE_API_BASE_URL` (sem valor real — Princípio VI da constitution)
- [X] T003 [P] Estender `pokerflow/src/vite-env.d.ts` com a tipagem de `ImportMetaEnv.VITE_API_BASE_URL?: string`

---

## Fase 2: Fundação (Bloqueia Todas as Histórias)

**⚠️ CRÍTICO**: nenhuma história de usuário começa antes desta fase terminar — nenhum endpoint funciona sem o domínio, a entidade e o módulo existirem.

- [X] T004 [P] Portar `generateRoomCode` (alfabeto `abcdefghijkmnpqrstuvwxyz23456789`, 7 caracteres, `crypto.getRandomValues`) de `pokerflow/src/services/mock/generateRoomCode.ts` para `my-api/src/planning-poker/domain/generate-room-code.ts`
- [X] T005 [P] Portar `RoomClientError`/`ErroRoomClient` de `pokerflow/src/types/room.ts` para `my-api/src/planning-poker/domain/room-client-error.ts`, com os 7 códigos (`SALA_NAO_ENCONTRADA`, `NOME_DUPLICADO`, `ENTRADA_INVALIDA`, `RODADA_JA_REVELADA`, `VALOR_INVALIDO`, `APENAS_MODERADOR`, e o novo `NAO_AUTORIZADO` — achado D1 do `/speckit-analyze`, `research.md` §6)
- [X] T006 [P] Portar `validation.ts` (`validarNomeSala`: 1-60 caracteres após sanitizar; `validarNomeParticipante`: 1-30 caracteres; `sanitizar`: remove `<>&"'`` `; `nomesIguaisCaseInsensitive`; classe `ValidationError`) de `pokerflow/src/services/mock/validation.ts` para `my-api/src/planning-poker/domain/validation.ts`
- [X] T007 [P] Testes unitários Jest de `validation.ts` (limites de tamanho, sanitização contra HTML/script, comparação case-insensitive) em `my-api/src/planning-poker/domain/validation.spec.ts` (co-localizado — Jest de unit do `my-api` usa `rootDir: "src"`, não descobre nada em `test/`) (depende de T006)
- [X] T008 Portar a lógica pura de sala/rodada de `pokerflow/src/services/mock/roomStore.ts` para `my-api/src/planning-poker/domain/room.ts`: `criarSala`, `estaExpirada` (limite de 4h — `LIMITE_INATIVIDADE_MS`), `adicionarParticipante` (rejeita `NOME_DUPLICADO`), `removerParticipante`, `votar`, `revelar`/`resetar` (rejeitam `APENAS_MODERADOR`), `resumoRodada` (consenso/dispersão/sem-consenso, iterando sobre `participantes` atuais — nunca sobre `Object.keys(votos)`) (depende de T004, T005, T006)
- [X] T008a Estender `criarSala`/`adicionarParticipante` (T008) para gerar também um `token` por participante (mesmo gerador aleatório de `generateRoomCode`/UUID — imprevisível), guardado no objeto interno do participante (`data-model.md` — "Identidade e credencial", achado D1); devolvido pela função só como valor de retorno adicional (`{ sala, participante, token }`), nunca dentro de `sala.participantes` (depende de T008)
- [X] T008b Estender `votar`, `removerParticipante`, `revelar`, `resetar` (T008) para receber `token` como parâmetro e validar contra o `token` interno do `participanteId` correspondente, lançando `RoomClientError("NAO_AUTORIZADO", ...)` se não bater ou o participante não existir — checado **antes** de `RODADA_JA_REVELADA`/`APENAS_MODERADOR` (depende de T008a)
- [X] T009 [P] Testes unitários Jest de `room.ts` cobrindo os mesmos casos das suítes Vitest de `pokerflow/tests/unit/roomStore.*.test.ts` (criar sala, expiração por inatividade, entrar/sair, nome duplicado, votar/revelar/resetar incluindo `APENAS_MODERADOR`, `resumoRodada` com consenso/dispersão/sem-consenso/voto órfão de quem saiu) **mais os casos novos de `NAO_AUTORIZADO`** (token ausente/errado em `votar`/`sair`/`revelar`/`resetar` — achado D1) em `my-api/src/planning-poker/domain/room.spec.ts` (co-localizado, mesmo motivo) (depende de T008, T008a, T008b)
- [X] T010 Criar entidade TypeORM `Room` em `my-api/src/planning-poker/room.entity.ts` (`@Entity('planning_poker_rooms')`) conforme `data-model.md`: `codigo` (`varchar(8)`, PK), `nome` (`varchar(60)`), `escalaPontos`→`escala_pontos` (`varchar(20)`), `moderadorId`→`moderador_id` (`varchar(36)`), `participantes` (`jsonb`, cada item inclui `token` interno — nunca serializado nas respostas HTTP), `rodada` (`jsonb`), `criadaEm`→`criada_em` (`timestamptz`), `ultimaAtividadeEm`→`ultima_atividade_em` (`timestamptz`)
- [X] T011 Implementar `PlanningPokerRepository` em `my-api/src/planning-poker/planning-poker.repository.ts`: `buscarPorCodigo` (transação com `SELECT ... FOR UPDATE` na linha — research.md §3; se `estaExpirada`, apaga a linha e retorna `null` — research.md §4), `salvar` (UPDATE/INSERT da linha inteira), `remover` (depende de T008, T010)
- [X] T012 Implementar `PlanningPokerExceptionFilter` em `my-api/src/planning-poker/planning-poker.exception-filter.ts`: captura `RoomClientError` (mapeia cada código para o status HTTP da tabela de `contracts/api-contract.md` — 404/409/400/403/**401 para `NAO_AUTORIZADO`**) **e** `ValidationError` (mapeia para 400, `codigo: "ENTRADA_INVALIDA"`); corpo sempre `{ "codigo": ..., "mensagem": ... }` (depende de T005, T006)
- [X] T013 Criar `PlanningPokerModule` em `my-api/src/planning-poker/planning-poker.module.ts`: registra `TypeOrmModule.forFeature([Room])` e `ThrottlerModule.forRoot(...)` escopado ao módulo (60 req/60s leitura, 20 req/60s escrita — research.md §8, contracts/api-contract.md); registra o módulo em `my-api/src/app.module.ts` **sem alterar** `AuthModule`/`UsersModule`/`ResumeLogModule` já existentes (depende de T011, T012)

**Checkpoint**: fundação pronta — as histórias de usuário podem começar.

---

## Fase 3: História de Usuário 1 - Time real usa a sala entre dispositivos diferentes (Prioridade: P1) 🎯 MVP

**Objetivo**: todos os endpoints de `contracts/api-contract.md` funcionando de ponta a ponta, com o frontend (`httpRoomClient.ts`) conversando com eles via polling, permitindo que dois dispositivos em redes diferentes usem a mesma sala.

**Teste Independente**: criar uma sala em um dispositivo/rede, entrar a partir de outro dispositivo/rede com o código, votar nos dois, revelar em um e confirmar que o outro reflete o resultado em poucos segundos.

### Testes para História 1

- [X] T014 [P] [US1] Testes e2e (Jest + supertest) do caminho feliz de `POST /planning-poker/rooms`, `POST /planning-poker/rooms/:codigo/participantes`, `GET /planning-poker/rooms/:codigo` em `my-api/test/planning-poker.e2e-spec.ts` — incluindo a asserção de que a resposta de criar/entrar contém `token` e que **nenhuma** resposta (nem essa, nem nenhum `GET` posterior) inclui `token` dentro de `participantes[]` (achado D1)
- [X] T015 [P] [US1] Testes e2e do caminho feliz de `POST /planning-poker/rooms/:codigo/votos`, `POST /planning-poker/rooms/:codigo/revelar`, `POST /planning-poker/rooms/:codigo/resetar` no mesmo arquivo — incluindo a asserção de que a resposta de `GET`/`votos` **nunca** contém `rodada.votos` nem o valor de voto de outro participante antes de `estado === "revelada"` (FR-004, formato de redação de `contracts/api-contract.md`)
- [X] T015a [P] [US1] Testes e2e do achado D1: `GET .../rooms/:codigo?participanteId=<outroId>` (sem `token`, ou com `token` errado) **nunca** inclui `meuVoto` na resposta, mesmo que `<outroId>` já tenha votado; `POST votos`/`sair`/`revelar`/`resetar` com `token` ausente ou incorreto retornam `401 NAO_AUTORIZADO` e não alteram o estado da sala — no mesmo arquivo de T014/T015

### Implementação da História 1

- [X] T016 [US1] Implementar `PlanningPokerService.criarSala/entrarNaSala/obterSala/sairDaSala` em `my-api/src/planning-poker/planning-poker.service.ts`, delegando ao domínio (T008/T008a/T008b) e ao repositório (T011); toda resposta que inclua `Sala` projeta `participantes` **sem** o campo `token` (achado D1); `obterSala` aplica a redação de `rodada` (`votantes`/`meuVoto`/`votos` conforme `contracts/api-contract.md`), incluindo `meuVoto` só quando `participanteId`+`token` recebidos batem com o dono; `sairDaSala` é **idempotente** — se a sala não existe/expirou, retorna sucesso sem erro (mesmo comportamento do mock, FR-001); só lança `NAO_AUTORIZADO` se a sala existe e o `token` não confere
- [X] T017 [US1] Estender `PlanningPokerService` com `votar`, `revelar`, `resetar` (mesma redação/projeção de resposta de T016; exigem `token` — repassado ao domínio via T008b, erro `NAO_AUTORIZADO` propaga como veio) (depende de T016)
- [X] T018 [US1] Implementar `PlanningPokerController` em `my-api/src/planning-poker/planning-poker.controller.ts` com as 7 rotas de `contracts/api-contract.md` (query/corpo incluindo `token` onde o contrato define), `@UseFilters(PlanningPokerExceptionFilter)` e o guard de rate limit por grupo (leitura/escrita) (depende de T012, T013, T016, T017)
- [X] T019 [P] [US1] Estender `ErroRoomClient` em `pokerflow/src/types/room.ts` com `"NAO_AUTORIZADO"` (achado D1 — precisa existir no tipo do frontend para `RoomClientError` reconstruído em `httpRoomClient.ts` ser type-safe, mesmo que o fluxo normal da UI nunca o dispare); criar `pokerflow/src/services/http/httpRoomClient.ts` implementando `criarSala`, `entrarNaSala` via `fetch` contra `VITE_API_BASE_URL`, guardando `{ participanteId, token, ehModerador }` em `sessionStorage["pokerflow:eu:<codigo>"]` (achado D1 — extensão do formato de 001); convertendo corpo de erro `{codigo, mensagem}` em `RoomClientError`, **sem** envolver falhas de rede/timeout/resposta não reconhecida nesse tipo (research.md §11 — achado E1, deixa propagar como erro comum para o fallback genérico que os hooks já têm)
- [X] T019a [US1] Estender `httpRoomClient.ts` com `sairDaSala`, lendo `token` de `sessionStorage["pokerflow:eu:<codigo>"]` e enviando como query param (`DELETE .../:participanteId?token=...`) (depende de T019)
- [X] T020 [US1] Estender `httpRoomClient.ts` com `obterSala(codigo)`: lê `{ participanteId, token }` de `sessionStorage["pokerflow:eu:<codigo>"]` e chama `GET /rooms/:codigo?participanteId=...&token=...`; reconstrói `Rodada.votos` local a partir de `votantes`/`meuVoto`/`votos` do payload (placeholder não-vazio, ex. `"•"`, para voto alheio ainda oculto — contracts/api-contract.md) (depende de T019)
- [X] T021 [US1] Estender `httpRoomClient.ts` com `votar`, `revelar`, `resetar`, enviando `token` (lido da mesma chave de `sessionStorage`) no corpo de cada requisição e reaproveitando a reconstrução de T020 (depende de T020)
- [X] T022 [US1] Implementar `assinarSala(codigo, callback)` em `httpRoomClient.ts`: `setInterval` de 2 segundos chamando `obterSala`, disparando `callback` só quando o payload mudar (comparação rasa), retornando a função de `clearInterval` para desinscrição (research.md §5) (depende de T020)
- [X] T023 [US1] Atualizar o wiring em `pokerflow/src/services/roomClient.ts`: usar `httpRoomClient` quando `import.meta.env.VITE_API_BASE_URL` estiver definido, caindo para `mockRoomClient` caso contrário — preserva rollback fácil (quickstart.md) (depende de T019, T019a, T020, T021, T022)
- [X] T024 [P] [US1] Testes unitários (Vitest, `fetch` mockado) de `httpRoomClient.ts` validando a montagem de cada requisição (incluindo `token` em body/query onde aplicável), a reconstrução de `votos` a partir do payload redigido, e que uma falha de `fetch` (rejeitada) nunca vira `RoomClientError` — em `pokerflow/tests/unit/httpRoomClient.test.ts`

**Checkpoint**: História 1 funcional — dois dispositivos/redes diferentes conseguem usar a mesma sala via API real, com polling a cada 2s.

---

## Fase 4: História de Usuário 2 - Comportamento já validado continua valendo (Prioridade: P2)

**Objetivo**: provar que todas as regras já certificadas em 001/002 (sigilo do voto, isolamento entre salas, nome duplicado, sala expirada, resetar rodada) continuam idênticas sobre o backend real — nenhuma implementação nova é esperada aqui além de testes; qualquer divergência encontrada é corrigida na Fundação/US1.

**Teste Independente**: repetir os cenários de erro e de isolamento das features 001/002 contra a API real e confirmar resultado idêntico ao mock.

### Testes para História 2

- [X] T025 [P] [US2] Testes e2e dos erros de negócio em `my-api/test/planning-poker.e2e-spec.ts`: `NOME_DUPLICADO` (nome repetido case-insensitive), `SALA_NAO_ENCONTRADA` (código inexistente e sala expirada — simular `ultima_atividade_em` antiga), `RODADA_JA_REVELADA` (votar após reveal), `VALOR_INVALIDO` (valor fora da escala), `APENAS_MODERADOR` (revelar/resetar sem ser o moderador, mas com `token` correto do não-moderador), `ENTRADA_INVALIDA` (nome vazio/maior que o limite); e a idempotência de `DELETE .../participantes/:participanteId` — sala inexistente/expirada retorna `204` sem erro (FR-001, mesmo comportamento do mock — ver correção em `contracts/api-contract.md`)
- [X] T026 [P] [US2] Teste e2e de isolamento entre duas salas simultâneas (criar duas salas, votar/revelar/resetar em uma, confirmar que a outra permanece com seu próprio estado inalterado — mesma regra de `pokerflow/tests/unit/mockRoomClient.salasSimultaneas.test.ts`, agora sobre o banco real) em `my-api/test/planning-poker.e2e-spec.ts`
- [X] T026a [P] [US2] Teste e2e de concorrência (achado E2): disparar em paralelo (`Promise.all`) múltiplos `votar` de participantes diferentes contra a mesma sala, e separadamente `revelar`+`resetar` quase simultâneos; confirmar que nenhuma requisição falha inesperadamente e o estado final é consistente (sem voto perdido nem corrompido) — prova o lock de linha de `research.md` §3/§12 em `my-api/test/planning-poker.e2e-spec.ts`
- [X] T026b [P] [US2] Teste e2e de rate limiting (achado E4): disparar mais requisições do que o limite configurado em T013 contra uma rota de leitura e uma de escrita, confirmar `429` com o corpo de `contracts/api-contract.md` — em `my-api/test/planning-poker.e2e-spec.ts`

**Checkpoint**: Histórias 1 e 2 funcionam juntas — API real, com paridade de comportamento comprovada em teste.

---

## Fase 5: História de Usuário 3 - Sala sobrevive a uma queda momentânea do moderador (Prioridade: P3)

**Objetivo**: o papel de moderador e o estado da sala sobrevivem no servidor independentemente do dispositivo de quem criou, incluindo reconexão dentro da janela de inatividade.

**Teste Independente**: criar sala, simular queda de conexão do moderador, reconsultar a sala a partir de outro cliente/dispositivo e confirmar que o papel de moderador e o estado continuam intactos.

### Testes para História 3

- [X] T027 [P] [US3] Teste e2e: após `POST /rooms` (moderador) e algumas ações, uma nova consulta `GET /rooms/:codigo?participanteId=<moderadorId>&token=<tokenDoModerador>` (simulando reconexão, com o `token` que o cliente teria guardado) continua retornando o mesmo `moderadorId` e o estado íntegro da sala, independente de qualquer estado local do cliente — em `my-api/test/planning-poker.e2e-spec.ts`

### Implementação da História 3

- [X] T028 [US3] Confirmar que `useModerator` (`pokerflow/src/hooks/useModerator.ts`, já existente da feature 001) funciona sem alteração de código contra `httpRoomClient`: `participanteId`/`token`/`ehModerador` continuam gravados em `sessionStorage` a partir da resposta de `criarSala`/`entrarNaSala` (T019), sobrevivendo a F5 — tarefa de verificação; se `useModerator` só usa `participanteId`/`ehModerador` e ignora `token`, nenhuma mudança de código é esperada nele (o `token` é lido só por `httpRoomClient`)
- [ ] T029 [US3] Validar manualmente o cenário de US3 do `quickstart.md` (passo 6 — derrubar a conexão do moderador e reabrir dentro da janela de inatividade) e registrar o resultado

**Checkpoint**: as 3 histórias funcionam juntas — sincronização entre dispositivos, paridade de comportamento e resiliência de moderador.

---

## Fase Final: Polimento e Preocupações Transversais

- [X] T030 [P] Rodar `npm test` e `npm run build` em `pokerflow`, confirmando que 100% da suíte Vitest de 001/002 continua passando com `httpRoomClient` sob teste (SC-003)
- [X] T031 [P] Rodar `npm run test` e `npm run test:e2e` em `my-api`, confirmando toda a suíte Jest do módulo `planning-poker` (unit + e2e)
- [ ] T032 Executar a validação manual ponta a ponta completa de `specs/003-integracao-backend-real/quickstart.md` (os 7 passos, incluindo pelo menos dois dispositivos/redes reais) e registrar o resultado no `ROADMAP.md`
- [ ] T033 [P] Rodar a skill `security-review` sobre o diff completo desta feature, nos dois repositórios, antes de considerá-la concluída (Princípio VI da constitution); incluir checagem manual de que nenhuma dependência nova (`@nestjs/throttler` incluída) exige plano pago (FR-007, achado E3) e de que nenhum `token` aparece em log/resposta fora do previsto em `contracts/api-contract.md`
- [ ] T034 Revisar as mensagens de erro do módulo `planning-poker` (`SALA_NAO_ENCONTRADA`, `NOME_DUPLICADO`, `RODADA_JA_REVELADA`, `VALOR_INVALIDO`, `APENAS_MODERADOR`, `ENTRADA_INVALIDA`, `NAO_AUTORIZADO`) garantindo que sejam amigáveis e não exponham detalhe técnico (mesma revisão já feita na feature 002)
- [ ] T035 [P] Atualizar `ROADMAP.md` marcando a feature 003 como implementada; revisar a nota do Princípio II da constitution (v1.4.1, "sigilo do voto best-effort na fase mock") confirmando que passou a ser estrutural — registrar isso como uma emenda PATCH/MINOR da constitution

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: sem dependências — pode rodar imediatamente
- **Fundação (Fase 2)**: depende do Setup; BLOQUEIA todas as histórias — nenhum endpoint existe sem domínio + entidade + módulo
- **Histórias de Usuário (Fase 3+)**: todas dependem da Fundação
  - US2 depende dos endpoints já existirem (criados em US1) para testar os casos de erro — não é uma dependência de código, é uma dependência de ordem de execução prática
  - US3 depende de `httpRoomClient`/wiring (criados em US1, T019-T023)
- **Polimento (Fase Final)**: depende de todas as histórias completas

### Oportunidades de Paralelismo

- T004/T005/T006 (Fundação) podem rodar em paralelo — arquivos independentes
- T014/T015/T015a (testes e2e de US1) podem ser escritos em paralelo antes da implementação (T016-T018)
- T019/T019a/T024 (frontend) e T016-T018 (backend) podem avançar em paralelo depois da Fundação, já que tocam repositórios diferentes — só T023 (wiring final) depende de ambos os lados estarem prontos
- T025/T026/T026a/T026b (testes de paridade/robustez de US2) podem rodar em paralelo entre si

---

## Exemplo de Paralelismo: História 1

```bash
# Backend (my-api) e frontend (pokerflow) em paralelo, depois da Fundação:
Task: "Testes e2e de criar/entrar/obter sala em my-api/test/planning-poker.e2e-spec.ts"
Task: "Criar httpRoomClient.ts (criarSala/entrarNaSala/sairDaSala) em pokerflow/src/services/http/httpRoomClient.ts"
```

---

## Estratégia de Implementação

### MVP primeiro (só História 1)

1. Completar Fase 2 (Fundação — CRÍTICA, bloqueia tudo)
2. Completar Fase 3 (História 1 — endpoints + `httpRoomClient` + polling)
3. **PARAR e VALIDAR**: abrir a mesma sala em dois dispositivos/redes diferentes, votar e revelar entre eles

### Entrega incremental

1. Fundação → domínio portado e testado, banco/módulo prontos
2. História 1 (sincronização real) → testar entre dispositivos → demo (MVP!)
3. História 2 (paridade de comportamento) → testar erros/isolamento → confirma que nada regrediu
4. História 3 (resiliência do moderador) → testar reconexão → feature 003 concluída
5. Polimento (suítes completas, quickstart manual, security-review, ROADMAP/constitution) → pronto para produção
