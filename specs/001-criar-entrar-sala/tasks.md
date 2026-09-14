---
description: "Lista de tarefas para a feature Criar e Entrar em uma Sala"
---

# Tarefas: Criar e Entrar em uma Sala

**Entrada**: Documentos de design de `specs/001-criar-entrar-sala/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: incluídos — o Princípio V/VI da constitution exige lógica de
sala/participante testável e testada por unidade, independente de UI.

**Organização**: tarefas agrupadas por história de usuário (spec.md), para
implementação e teste independentes.

## Formato: `[ID] [P?] [História?] Descrição com caminho de arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1/US2/US3]**: história de usuário correspondente (spec.md)

## Fase 1: Setup (Infraestrutura Compartilhada)

- [X] T001 Criar a estrutura de diretórios do projeto (`src/`, `api/` reservado, `tests/`) na raiz, conforme `plan.md`
- [X] T002 Inicializar projeto Node.js/TypeScript (`package.json`, `tsconfig.json`) com React 18 + Vite + React Router 6
- [X] T003 [P] Configurar ESLint + Prettier para lint/formatação
- [X] T004 [P] Configurar Vitest + React Testing Library integrados ao Vite

**Checkpoint**: ambiente pronto para desenvolvimento.

---

## Fase 2: Fundação (Bloqueia Todas as Histórias)

**⚠️ CRÍTICO**: nenhuma história de usuário começa antes desta fase terminar.

- [X] T005 Criar tipos compartilhados em `src/types/room.ts` (`Sala`, `Participante`, `EscalaPontos`) conforme `data-model.md`
- [X] T006 Implementar validação/sanitização de nomes em `src/services/mock/validation.ts` — nome da sala: obrigatório, 1-60 caracteres após `trim()`, sanitizado contra HTML/script; nome do participante: obrigatório, 1-30 caracteres, sanitizado (Princípio VI da constitution)
- [X] T007 Implementar gerador de código de sala em `src/services/mock/generateRoomCode.ts` (6-8 caracteres alfanuméricos via `crypto.getRandomValues`, sem dependência externa — `research.md` §3)
- [X] T008 Implementar lógica pura de sala em `src/services/mock/roomStore.ts` — criar sala, adicionar participante, checar nome duplicado (case-insensitive) na mesma sala (FR-006), atualizar `ultimaAtividadeEm` (depende de T005, T006, T007)
- [X] T008a Implementar verificação de expiração por inatividade em `roomStore.ts` — `obterSala` DEVE tratar a sala como inexistente se `agora - ultimaAtividadeEm > 4 horas` (FR-008, limite definido em `research.md` §5); necessário porque o mock usa `localStorage`, que não expira sozinho (depende de T008)
- [X] T009 Definir a interface `roomClient` em `src/services/roomClient.ts` conforme `contracts/api-contract.md` (depende de T005)
- [X] T010 Implementar `mockRoomClient` em `src/services/mock/mockRoomClient.ts` — `localStorage` como fonte da verdade + `BroadcastChannel` para notificar outras abas (`research.md` §1) (depende de T008, T009)
- [X] T011 [P] Criar tokens de design em `src/styles/tokens.css` (cores/tipografia do canvas de design — tema escuro padrão + variante clara)
- [X] T012 Configurar shell e rotas do app em `src/App.tsx`/`src/main.tsx` (rotas `/` e `/sala/:codigo` via React Router) (depende de T009)

**Checkpoint**: fundação pronta — as histórias de usuário podem começar.

---

## Fase 3: História de Usuário 1 - Criar uma sala (Prioridade: P1) 🎯 MVP

**Objetivo**: usuário preenche nome da sala, seu nome e escala de pontos, e cria a sala recebendo um link/código único, entrando como moderador.

**Teste Independente**: preencher os 3 campos e criar uma sala; verificar link/código gerado e o criador já dentro da sala como moderador.

### Testes para História 1

- [X] T013 [P] [US1] Teste unitário de criação de sala válida em `tests/unit/roomStore.criarSala.test.ts`
- [X] T014 [P] [US1] Teste unitário de validação de campos obrigatórios (nome da sala, nome do criador, escala de pontos) em `tests/unit/validation.test.ts`

### Implementação da História 1

- [X] T015 [US1] Implementar hook `useCreateRoom` em `src/hooks/useCreateRoom.ts` (chama `roomClient.criarSala`, navega para `/sala/:codigo`) (depende de T010, T012)
- [X] T016 [P] [US1] Construir `CreateRoomForm` em `src/components/CreateRoomForm/CreateRoomForm.tsx` (3 campos: nome da sala, seu nome, escala de pontos como seletor entre Fibonacci modificado / Sequencial / Camisetas — FR-002a) conforme o canvas de design
- [X] T017 [US1] Construir `CreateRoomPage` em `src/pages/CreateRoomPage.tsx` integrando `CreateRoomForm` + `useCreateRoom` (depende de T015, T016)
- [X] T018 [US1] Adicionar validação inline que impede o envio sem os 3 campos preenchidos (Cenário de Aceite 3 da US1) em `CreateRoomForm.tsx`
- [X] T019 [US1] Estilizar `CreateRoomForm`/`CreateRoomPage` com CSS Modules replicando o mockup "Criar Sala" do canvas, temas escuro/claro (depende de T011, T017)
- [X] T020 [US1] Garantir layout responsivo da tela de criação (FR-011/SC-005) em `CreateRoomForm.module.css`

**Checkpoint**: História 1 funcional e testável de forma independente.

---

## Fase 4: História de Usuário 2 - Entrar em uma sala existente (Prioridade: P1)

**Objetivo**: participante acessa o link/código e entra informando apenas um nome, sem cadastro.

**Teste Independente**: acessar um link/código de sala existente, informar um nome e verificar que aparece na lista de participantes para os demais.

### Testes para História 2

- [X] T021 [P] [US2] Teste unitário de entrada com nome disponível em `tests/unit/roomStore.entrarNaSala.test.ts`
- [X] T022 [P] [US2] Teste unitário de rejeição de nome duplicado case-insensitive (FR-006) em `tests/unit/roomStore.nomeDuplicado.test.ts`
- [X] T023 [P] [US2] Teste unitário de sala inexistente retornando erro claro (FR-009) em `tests/unit/roomStore.salaInexistente.test.ts`
- [X] T023a [P] [US2] Teste unitário de sala expirada por inatividade (>4h) retornando o mesmo erro de sala não encontrada (FR-008/FR-009) em `tests/unit/roomStore.salaExpirada.test.ts` (depende de T008a)

### Implementação da História 2

- [X] T024 [US2] Implementar hook `useJoinRoom` em `src/hooks/useJoinRoom.ts` (chama `roomClient.entrarNaSala`, trata os erros `SALA_NAO_ENCONTRADA`/`NOME_DUPLICADO`) (depende de T010)
- [X] T025 [P] [US2] Construir `JoinRoomForm` em `src/components/JoinRoomForm/JoinRoomForm.tsx` (campo de nome + mensagens de erro)
- [X] T026 [US2] Construir `RoomPage` em `src/pages/RoomPage.tsx` (mostra `JoinRoomForm` se o usuário ainda não é participante; mostra mensagem de sala não encontrada — FR-009 — se o código for inválido) (depende de T024, T025)
- [X] T027 [US2] Implementar hook `useModerator` em `src/hooks/useModerator.ts` (lê/persiste `localStorage["pokerflow:eu:<codigo>"]`, FR-010) (depende de T005)
- [X] T028 [US2] Integrar `useModerator` em `RoomPage` para que o papel de moderador sobreviva a um F5 (depende de T026, T027)
- [X] T029 [US2] Estilizar `JoinRoomForm`/estado de entrada de `RoomPage` com CSS Modules conforme o canvas, responsivo (FR-011) (depende de T011, T026)

**Checkpoint**: Histórias 1 e 2 funcionam juntas — fluxo completo de criar → compartilhar link → entrar.

---

## Fase 5: História de Usuário 3 - Sair e ver participantes atualizados (Prioridade: P2)

**Objetivo**: a lista de participantes reflete entradas e saídas em tempo real para todos na sala.

**Teste Independente**: abrir a sala em duas abas, fechar uma, e verificar que a outra atualiza a lista sem recarregar.

### Testes para História 3

- [X] T030 [P] [US3] Teste unitário de remoção de participante ao sair em `tests/unit/roomStore.sairDaSala.test.ts`

### Implementação da História 3

- [X] T031 [US3] Implementar `roomClient.sairDaSala` em `mockRoomClient.ts`, disparado no evento `beforeunload` (depende de T010)
- [X] T032 [P] [US3] Construir `ParticipantList` em `src/components/ParticipantList/ParticipantList.tsx` (lista ao vivo, indicando quem é o moderador) conforme o canvas
- [X] T033 [US3] Implementar hook `useRoom` em `src/hooks/useRoom.ts` assinando `roomClient.assinarSala` para manter a lista atualizada em tempo real (SC-004: até 3s) (depende de T010)
- [X] T034 [US3] Integrar `ParticipantList` + `useRoom` em `RoomPage` (depende de T026, T032, T033)
- [X] T035 [US3] Tratar fechamento de aba/desconexão chamando `sairDaSala` (T031) e refletindo a remoção nas outras abas

**Checkpoint**: as 3 histórias de usuário funcionam de forma independente e juntas.

---

## Fase Final: Polimento e Preocupações Transversais

- [X] T036 [P] Adicionar alternância de tema claro/escuro (persistida) em `CreateRoomPage`/`RoomPage`, conforme o canvas de design
- [X] T037 [P] Rodar `npm run build` e confirmar build de produção sem erros/avisos
- [X] T038 Executar a validação manual ponta a ponta de `quickstart.md` e registrar o resultado
- [X] T039 [P] Rodar a skill `security-review` sobre a feature completa antes de considerá-la concluída (Princípio VI da constitution)
- [X] T040 Revisar todas as mensagens de erro visíveis ao usuário para garantir que nenhuma exponha detalhes técnicos (FR-009)

**Notas de execução**:
- T038: validado via testes automatizados (18/18) + `npm run build` + `npm run dev` respondendo. O teste manual real entre duas abas de navegador (localStorage/BroadcastChannel) ainda precisa ser feito por um humano — não pôde ser automatizado neste ambiente.
- T039: `security-review` não encontrou nenhum achado HIGH/MEDIUM (código é 100% client-side/mock nesta fase, sem trust boundary de servidor ainda).
- T040: corrigido `useCreateRoom.ts`, que exibia `Error.message` de qualquer exceção — agora só mostra mensagens de `ValidationError` (conhecidas e seguras), com fallback genérico para qualquer erro inesperado.

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: sem dependências — pode começar imediatamente
- **Fundação (Fase 2)**: depende da Fase 1 — BLOQUEIA todas as histórias
- **Histórias de Usuário (Fase 3+)**: todas dependem da Fundação
  - US1 e US2 podem avançar em paralelo entre si (compartilham T010/T012), mas US2 (`RoomPage`) precisa existir antes de US3 se integrar a ela
  - US3 depende de `RoomPage` (T026, criada em US2)
- **Polimento (Fase Final)**: depende de todas as histórias desejadas estarem completas

### Oportunidades de Paralelismo

- Tarefas [P] na Fase 1 e Fase 2 podem rodar em paralelo entre si
- Testes unitários marcados [P] dentro de cada história podem rodar em paralelo
- `CreateRoomForm` (US1) e `JoinRoomForm`/`ParticipantList` (US2/US3) são arquivos diferentes e podem ser construídos em paralelo depois da Fundação

---

## Exemplo de Paralelismo: História 1

```bash
# Testes da História 1 em paralelo:
Task: "Teste unitário de criação de sala válida em tests/unit/roomStore.criarSala.test.ts"
Task: "Teste unitário de validação de campos obrigatórios em tests/unit/validation.test.ts"

# Depois da Fundação, componente de UI em paralelo com o hook:
Task: "Construir CreateRoomForm em src/components/CreateRoomForm/CreateRoomForm.tsx"
```

---

## Estratégia de Implementação

### MVP primeiro (só História 1)

1. Completar Fase 1 (Setup) e Fase 2 (Fundação — CRÍTICA, bloqueia tudo)
2. Completar Fase 3 (História 1 — criar sala)
3. **PARAR e VALIDAR**: testar a criação de sala de forma independente
4. Já é possível demonstrar a criação de sala e o link gerado

### Entrega incremental

1. Setup + Fundação → base pronta
2. História 1 (criar) → testar → demo (MVP)
3. História 2 (entrar) → testar → demo (fluxo completo criar+entrar)
4. História 3 (lista em tempo real) → testar → demo (experiência completa)
5. Polimento (tema, build, quickstart, security-review) → feature 001 concluída
