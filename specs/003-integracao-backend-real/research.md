# Fase 0 — Pesquisa: Integração com Backend Real

Todas as incógnitas do Contexto Técnico do `plan.md` são resolvidas abaixo.
O objetivo é trocar o "motor" (mock local → API real) preservando 100% do
comportamento já certificado em 001/002, dentro das restrições da
constitution (v1.5.0): sem WebSocket persistente, backend em `my-api`
(módulo isolado), Postgres já provisionado reaproveitado.

## 1. Onde e como persistir o estado da sala

**Decisão**: uma única tabela `planning_poker_rooms`, com `participantes` e
`rodada` guardados como colunas `jsonb` (arrays/objetos aninhados), em vez de
tabelas relacionais separadas (`rooms` / `participants` / `votes` com FKs).

**Racional**: a lógica de domínio já existente em `roomStore.ts` (mock)
opera inteiramente sobre um único grafo de objeto `Sala` (leitura → nova
`Sala` → escrita completa). Modelar isso como 1 linha = 1 sala com `jsonb`
mantém as funções puras (`criarSala`, `votar`, `revelar`, `resetar`,
`resumoRodada`) praticamente idênticas ao mock — só troca o alvo de
leitura/escrita (banco em vez de `localStorage`). Dado o volume (~15
participantes/sala, sala descartada em poucas horas — Princípio IV), o custo
de normalizar em tabelas com FK (mais joins, mais migrations, mais
superfície de bug) não se paga: violaria o Princípio I (YAGNI).

**Alternativas consideradas**:
- *Tabelas normalizadas* (`rooms`, `participants`, `votes`): mais "correto"
  no sentido relacional tradicional, mas exige reescrever a lógica de
  domínio para trabalhar com queries/joins em vez de um objeto único, sem
  ganho real dado o ciclo de vida curto e o volume pequeno dos dados.
- *Redis/KV externo*: exigiria um novo serviço fora do que já está
  provisionado — rejeitado pela decisão já tomada de reaproveitar o Postgres
  existente do `my-api` (ver constitution, "Backend real: repositório
  `my-api`").

## 2. Chave de busca da sala

**Decisão**: `codigo` (string, 7 caracteres, mesmo alfabeto/gerador do mock)
é a **chave primária** da tabela — não existe um `id` numérico surrogate
separado.

**Racional**: toda busca de sala no sistema é por `codigo`
(`GET /api/rooms/:codigo`, e todas as ações subsequentes). Um `id`
autoincremento adicional (padrão usado em `users`/`resume-log` do `my-api`)
não teria nenhum uso — seria complexidade sem propósito.

**Alternativas consideradas**: `id` serial + `codigo` como coluna `UNIQUE`
separada (padrão do resto do `my-api`) — rejeitado por não agregar nada
neste caso específico.

## 3. Concorrência (dois votos/ações quase simultâneas)

**Decisão**: cada ação de escrita (`votar`, `revelar`, `resetar`, entrar,
sair) é feita dentro de uma transação com `SELECT ... FOR UPDATE` na linha da
sala (lock pessimista de linha), seguindo o mesmo padrão
ler-a-sala-inteira → aplicar função pura → salvar-a-sala-inteira do mock,
agora atômico por transação.

**Racional**: como o modelo é "1 linha = 1 sala" (decisão #1), um lock de
linha resolve toda a classe de corrida (dois votos, revelar+resetar
simultâneos) sem precisar de lógica de merge — o último a obter o lock vê o
estado mais recente e aplica sua mutação sobre ele. Simples, correto, e
compatível com o Postgres já existente sem infra nova.

**Alternativas consideradas**: lock otimista (coluna de versão +
retry-on-conflict) — mais complexo de implementar corretamente e sem
benefício de performance perceptível nesta escala (poucas escritas/segundo
por sala).

## 4. Expiração de sala por inatividade

**Decisão**: verificação **preguiçosa** (lazy) no momento da leitura/ação —
idêntica à função `estaExpirada` já existente no mock: se
`agora - ultimaAtividadeEm > 4h`, a sala é tratada como inexistente
(`SALA_NAO_ENCONTRADA`) e a linha é apagada nesse momento. Não há job/cron
de limpeza em background.

**Racional**: funções serverless da Vercel não têm processo de fundo
persistente (mesma restrição que já impede WebSocket real — constitution,
Restrições Tecnológicas). Um cron de limpeza exigiria infraestrutura nova
(ex.: Vercel Cron), o que violaria "backend real reaproveita o que já
existe, sem novo custo". A checagem preguiçosa já é o comportamento validado
em produção pelo mock (FR-008 da feature 001) e é suficiente: uma sala
"zumbi" sem ninguém a consultando não incomoda ninguém, e volume é
irrelevante nesta escala.

**Alternativas consideradas**: Vercel Cron Job de limpeza periódica —
rejeitado por adicionar componente novo sem necessidade funcional.

## 5. Sincronização em tempo (quase) real — polling

**Decisão**: o frontend (`httpRoomClient.ts`) consulta
`GET /api/rooms/:codigo` a cada **2 segundos** enquanto a tela de sala está
aberta, substituindo a assinatura via `BroadcastChannel` do mock.
`assinarSala(codigo, callback)` mantém a mesma assinatura de função; por
dentro, vira um `setInterval` que chama `obterSala` e só invoca `callback`
quando o payload muda (comparação rasa/hash simples), parando no
`unsubscribe` retornado (mesmo contrato de limpeza do `useEffect` já usado
pelos hooks).

**Racional**: 2s de intervalo garante folga confortável para a meta de SC-002
(mudança visível em até 5s, contando latência de rede), e é o "intervalo
curto" que a constitution já prevê como padrão (Restrições Tecnológicas).

**Alternativas consideradas**: SSE (Server-Sent Events) — tecnicamente
possível em função serverless, mas a Vercel corta a conexão por timeout no
free tier e adiciona complexidade de reconexão sem necessidade, dado que
polling simples já atende a meta de UX.

## 6. Identidade de participante sem conta (Princípio IV)

**Decisão revisada (pós-`/speckit-analyze`, achado D1 — CRITICAL)**: a
primeira versão desta decisão tratava `participanteId` como se fosse, ao
mesmo tempo, um identificador público (exibido a todos na lista de
participantes, e como `sala.moderadorId`) **e** uma credencial secreta
(usada para liberar `meuVoto`/`revelar`/`resetar`/`sair`). Isso é
contraditório: se todo mundo na sala já vê o `id` de todo mundo — inclusive
o `moderadorId` — na resposta normal de `GET /rooms/:codigo`, então
`participanteId` nunca foi secreto o suficiente para servir de credencial.
Qualquer participante poderia chamar a API diretamente (curl, devtools) com
o `id` de outro participante e ler o voto alheio antes do reveal (viola
FR-004/Princípio II) ou com o `moderadorId` e revelar/resetar sem ser o
moderador (viola `APENAS_MODERADOR`).

**Nova decisão**: separar identidade pública de credencial privada.

- `participanteId` continua público — é o que aparece em
  `participantes[].id`, `moderadorId`, `votantes`, e serve só para
  identificar/exibir (chave de lista, badge de moderador, "quem já votou").
- `entrarNaSala`/`criarSala` passam a devolver **também** um `token`
  (string aleatória, gerada com o mesmo mecanismo de UUID já usado para
  `participanteId` — imprevisível o suficiente para servir de segredo,
  mesmo raciocínio já aplicado a IDs em outras revisões de segurança deste
  projeto). O `token` é devolvido **uma única vez**, só para o dono, na
  resposta HTTP de quem criou/entrou — nunca aparece em `participantes[]`
  nem em nenhuma leitura posterior de `Sala`. O cliente grava
  `{ participanteId, token, ehModerador }` no mesmo `sessionStorage`
  já usado para sobreviver a F5 (extensão do formato de `pokerflow:eu:<codigo>`
  definido em `specs/001-criar-entrar-sala/data-model.md` — a chave e o
  propósito não mudam, só ganha o campo `token`).
- Toda ação que hoje só verificava `participanteId` passa a exigir também o
  `token` correspondente, validado no servidor contra o valor guardado
  internamente (nunca serializado) na linha da sala:
  - `votar`, `sair`: `token` precisa bater com o do `participanteId`
    informado — senão `NAO_AUTORIZADO`.
  - `revelar`, `resetar`: além de `participanteId === moderadorId`
    (regra já existente), o `token` também precisa bater — senão
    `NAO_AUTORIZADO`.
  - `obterSala` (GET): `token` é **opcional** — se ausente ou não bater,
    a resposta simplesmente omite `meuVoto` (nenhum erro; só não revela o
    próprio voto de ninguém que não prove que é o dono). `votantes`,
    `estado`, `participantes`, `moderadorId` continuam públicos, como já
    eram (esses nunca precisaram de segredo — só indicam "quem", não "o
    quê" cada um votou).

**Racional**: continua sem contradizer o Princípio IV (nenhuma conta, senha
ou e-mail — o `token` é efêmero, ligado só à sessão daquela sala, do mesmo
jeito que `participanteId` já era) e agora entrega de verdade o que FR-004 e
o Princípio II exigem: impossível ler o voto ou agir como moderador sem
possuir um segredo que só o navegador daquela pessoa recebeu uma vez.

**Alternativas consideradas**:
- *Manter só `participanteId`* (decisão original) — rejeitada: não resiste
  a inspeção de rede/chamada direta à API, o próprio cenário que o
  Princípio II lista explicitamente como inaceitável.
- *JWT/sessão completa* — rejeitada por ser mais do que o problema pede;
  um valor opaco de posse (mesma filosofia de `participanteId`, só que
  privado) já resolve, sem introduzir conceito de autenticação real.

## 7. Validação e sanitização de entrada

**Decisão**: a lógica pura de `validation.ts` do mock (`validarNomeSala`,
`validarNomeParticipante`, sanitização contra HTML/script) é portada quase
literalmente para o módulo `planning-poker` do `my-api`, como parte da
camada de domínio — **sem** instalar `class-validator`/`class-transformer`
(ausentes hoje no `my-api`; ver revisão anterior). Os DTOs dos endpoints
seguem o padrão já usado em `auth`/`users` (classes simples), e a validação
de fato acontece nas funções de domínio, que são as mesmas usadas nos testes
unitários.

**Racional**: reaproveitar código já escrito, revisado e testado é mais
simples do que introduzir uma dependência nova só para este módulo
(Princípio I). Mantém a lógica de validação testável independente de
HTTP/framework (Princípio V).

**Alternativas consideradas**: `class-validator` + `ValidationPipe` local ao
controller — despreza o código de validação já existente sem necessidade.

## 8. Rate limiting

**Decisão**: `@nestjs/throttler`, aplicado **só ao controller do módulo
`planning-poker`** (guard local, não global) — limite generoso o bastante
para não atrapalhar o polling legítimo (ex.: 60 requisições/minuto por IP
para leitura, 20/minuto por IP para ações de escrita), aplicado por IP de
origem.

**Racional**: a constitution (Princípio VI) exige rate limiting básico nos
endpoints públicos. `@nestjs/throttler` é a lib oficial do ecossistema
NestJS, leve, e não exige infraestrutura nova (usa memória do processo).

**Limitação conhecida e aceita**: como as funções serverless da Vercel não
compartilham memória entre instâncias/cold starts, a contagem de
`@nestjs/throttler` é por instância, não globalmente precisa — mesma
categoria de limitação já documentada para o sigilo do voto na fase mock
(constitution, nota do Princípio II). Funciona como defesa em profundidade
contra abuso grosseiro, não como garantia matemática — aceitável para o
escopo desta feature (não é um serviço com API paga a proteger de custo por
requisição).

**Alternativas consideradas**: rate limiting via serviço externo
(ex.: Upstash Ratelimit) — rejeitado por adicionar dependência paga/nova
para um requisito que já tem uma solução "boa o suficiente" com o que já
existe.

## 9. Mapeamento de erros de domínio → HTTP

**Decisão**: um `RoomClientError` (mesmo nome/formato do mock, portado para
o domínio do `my-api`) capturado por um `ExceptionFilter` dedicado ao
controller do módulo, mapeando:

| Código de domínio | Status HTTP |
|---|---|
| `SALA_NAO_ENCONTRADA` | 404 |
| `NOME_DUPLICADO` | 409 |
| `RODADA_JA_REVELADA` | 409 |
| `VALOR_INVALIDO` | 400 |
| `ENTRADA_INVALIDA` | 400 |
| `APENAS_MODERADOR` | 403 |
| `NAO_AUTORIZADO` (novo — achado D1) | 401 |

Corpo da resposta de erro: `{ "codigo": "<ErroRoomClient>", "mensagem": "<texto seguro para exibir>" }`
— mesmo par (código, mensagem) que `RoomClientError` já expõe no mock, só que
via JSON em vez de exceção JS lançada no cliente.

**Racional**: `httpRoomClient.ts` (frontend) precisa reconstruir o mesmo
`RoomClientError` que os componentes/hooks já sabem tratar (nenhuma mudança
de UI) — o único jeito de trocar o motor "sem reescrever componentes" é
preservar esse contrato de erro byte a byte.

## 10. Organização de camadas dentro do módulo `planning-poker`

**Decisão**: três camadas dentro do módulo, espelhando a separação que já
existe no mock (Princípio V):

- `domain/` — funções puras portadas do mock (`criarSala`, `votar`,
  `revelar`, `resetar`, `resumoRodada`, `estaExpirada`, `validation.ts`,
  `generateRoomCode.ts`), sem NestJS, sem TypeORM. É o que os testes Jest
  testam diretamente, sem precisar de banco.
- `room.entity.ts` + `room.repository` (via `TypeOrmModule.forFeature`) —
  única responsabilidade: ler/escrever a linha `jsonb` inteira, com o lock de
  linha da decisão #3.
- `planning-poker.controller.ts` + `planning-poker.service.ts` — adaptador
  fino: recebe HTTP, chama o repositório para ler a sala, chama a função de
  domínio correspondente, salva o resultado, devolve JSON. `ExceptionFilter`
  (decisão #9) cuida da tradução de erro.

**Racional**: mesma motivação do Princípio V já aplicado no mock — a máquina
de estados da rodada não pode depender de HTTP nem de TypeORM para ser
testada, e portar o código quase literalmente reduz risco de introduzir
regressão em comportamento já certificado (US2 da spec 003).

## 11. Falha temporária de rede/servidor (FR-009/SC-004 — achado E1)

**Decisão**: `httpRoomClient.ts` só lança `RoomClientError` quando a
resposta HTTP tem corpo `{ codigo, mensagem }` reconhecido (erro de
negócio). Qualquer outra falha — `fetch` rejeitado (rede indisponível),
timeout, resposta 5xx sem corpo JSON válido — propaga como um erro comum
(`Error` simples, **não** `RoomClientError`), sem tentar reescrevê-lo.

**Racional**: os hooks que já existem (`useRodada`, `useJoinRoom`,
`useCreateRoom` — features 001/002) **já** têm exatamente essa distinção
implementada: `e instanceof RoomClientError ? e.message : "Não foi possível
X. Tente novamente."`. Ou seja, o comportamento pedido por FR-009/SC-004
("falha temporária comunicada de forma clara, distinta de 'sala não
encontrada', sem recarregar a página") já existe na UI desde 001/002 — só
não tinha sido conectado a nenhuma fonte real de falha de rede, porque o
mock nunca falha por rede. Não é necessária nenhuma mudança em hooks/
componentes; só cuidado em `httpRoomClient.ts` para não "engolir" um erro
de rede genérico dentro de um `RoomClientError` (o que faria a UI mostrar a
mensagem errada).

## 12. Concorrência — cobertura de teste (achado E2)

O lock de linha (decisão #3) resolve a concorrência por design, mas precisa
de um teste e2e que dispare ações em paralelo (`Promise.all` contra o mesmo
`codigo`) para provar isso na prática, não só na leitura do código — ver
`tasks.md`, fase de paridade (US2).

## 13. CORS

**Decisão**: nenhuma mudança. `my-api` já roda com `app.enableCors()` sem
restrição de origem — o frontend do PokerFlow funciona sem configuração
adicional.

**Racional**: apertar CORS globalmente afetaria outros consumidores da API
existente (fora do escopo combinado: só mexer no que impacta o PokerFlow).
Se isso precisar mudar no futuro, é uma decisão própria do `my-api`, não
desta feature.
