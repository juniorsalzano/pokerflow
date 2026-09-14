# Quickstart — Validação da Integração com Backend Real

Guia para rodar e validar esta feature ponta a ponta, localmente, nos dois
repositórios envolvidos.

## Pré-requisitos

- `my-api` (`/home/junior/projetos/my-api`) com `POSTGRES_URL` configurado em
  `.env` (mesmo Postgres já usado pelo site de currículo — nenhuma
  infraestrutura nova).
- `pokerflow` (este repositório) com uma variável `VITE_API_BASE_URL`
  apontando para o `my-api` rodando localmente (ex.:
  `VITE_API_BASE_URL=http://localhost:3000/planning-poker` em `.env.local`).
- Node 20+ nos dois projetos.

## Subir o backend

```bash
cd /home/junior/projetos/my-api
npm install   # só se houver dependência nova (ex.: @nestjs/throttler)
npm run start:dev
```

Validar que o módulo subiu:

```bash
curl -s http://localhost:3000/planning-poker/rooms/codigo-inexistente
# esperado: 404, { "codigo": "SALA_NAO_ENCONTRADA", ... }
```

## Rodar os testes de domínio/contrato do backend

```bash
cd /home/junior/projetos/my-api
npm run test         # unit — funções puras de domínio (votar/revelar/resetar/resumoRodada)
npm run test:e2e     # e2e — endpoints do módulo planning-poker via supertest
```

**Esperado**: todos os testes portados de
`pokerflow/tests/unit/roomStore.*.test.ts` (mesmos casos, agora em Jest)
passam, incluindo os cenários de erro (`RODADA_JA_REVELADA`,
`VALOR_INVALIDO`, `APENAS_MODERADOR`, `NOME_DUPLICADO`).

## Subir o frontend apontando para a API real

```bash
cd /home/junior/projetos/pokerflow
npm run dev
```

Com `VITE_API_BASE_URL` configurado, `httpRoomClient.ts` substitui
`mockRoomClient.ts` — nenhuma mudança de componente necessária (ver
`contracts/api-contract.md`).

## Rodar os testes automatizados do frontend

```bash
cd /home/junior/projetos/pokerflow
npm test    # Vitest — inclui os testes de componente de sigilo do voto (SeatCard)
npm run build
```

**Esperado**: 100% dos testes que já passavam contra o mock continuam
passando (SC-003 da spec) — a suíte não deveria precisar mudar, só o
`roomClient` usado por trás.

## Validação manual — ponta a ponta (o que os testes automatizados não cobrem)

Isso precisa de um humano, como já foi o caso nas features 001/002:

1. **Criar sala** em um navegador/dispositivo (ex.: notebook), obter o link.
2. **Entrar na sala** em um segundo dispositivo/rede diferente (ex.: celular
   em 4G, ou um segundo notebook em outra rede) usando o código — confirmar
   que ambos veem a mesma lista de participantes (US1).
3. **Votar nos dois dispositivos**, confirmar que:
   - cada um vê o próprio voto imediatamente (FR-004a);
   - nenhum vê o valor do outro antes de revelar — só o indicador "já
     votou" (FR-004, verificável inspecionando a aba Network do navegador:
     o payload de `GET /planning-poker/rooms/:codigo` não deve conter o
     valor do voto alheio antes do reveal).
4. **Revelar** a partir do dispositivo do moderador — confirmar que o outro
   dispositivo reflete a revelação em até ~5 segundos, sem recarregar a
   página (SC-002).
5. **Resetar** e repetir uma segunda rodada — confirmar que os votos da
   rodada anterior não vazam para a nova (mesma regra do mock).
6. **Derrubar a conexão do moderador** (ex.: modo avião por alguns segundos,
   ou fechar a aba) e voltar **dentro de 10 minutos** — confirmar que ele
   continua reconhecido como moderador da mesma sala, com o mesmo
   `participanteId` (US3, FR-010/FR-011: `localStorage` local + heartbeat do
   servidor concordando).
7. **Ausência além da janela de tolerância**: fechar a aba do moderador e
   esperar mais de 10 minutos sem reabrir (ou, pra não esperar de verdade,
   ajustar temporariamente a constante de tolerância no `my-api` durante o
   teste) — confirmar que ele some da lista de participantes pros demais, e
   que reabrir o link pede nome de novo (novo `participanteId`, sem papel de
   moderador automático) — FR-011.
8. **Duas salas simultâneas**: repetir os passos 1-5 numa segunda sala, em
   paralelo — confirmar isolamento total entre elas (US2).

## Rollback / desativação

Como `httpRoomClient.ts` e `mockRoomClient.ts` seguem o mesmo contrato
`roomClient`, reverter para o mock (ex.: se a API real apresentar problema em
produção) é trocar de volta qual implementação é injetada — sem mudança de
componente. Não há migração de dado a desfazer: o estado do mock é local por
navegador, e o estado do backend real fica isolado em suas próprias tabelas
`planning_poker_*` no Postgres do `my-api` (nada é destrutivo para o resto
daquele projeto).
