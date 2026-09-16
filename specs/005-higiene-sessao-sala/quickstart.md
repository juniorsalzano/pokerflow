# Quickstart: validação manual — Higiene de Sessão da Sala

Pré-requisitos: `pokerflow` rodando contra o `my-api` real
(`VITE_API_BASE_URL` configurada — sem isso, cai no mock, que fica fora de
escopo desta feature). Duas abas/dispositivos ajudam a simular mais de um
participante, como já é hábito nas features anteriores.

## 1. Sala encerra quando o moderador sai explicitamente (US1, FR-001/FR-003/FR-005)

1. Criar uma sala (aba A, você é o moderador).
2. Entrar na mesma sala em outra aba/dispositivo (aba B, participante comum).
3. Na aba A, clicar em "sair da sala".
4. **Esperado**: em até ~2s (próximo ciclo de polling), a aba B mostra uma
   mensagem específica de "a sala foi encerrada porque o moderador saiu" —
   não a mensagem genérica de sala não encontrada/expirada.
5. Recarregar a aba B depois de ~40s (passada a janela de tombstone).
   **Esperado**: agora mostra a mensagem genérica de sala não
   encontrada/expirada — comportamento indistinguível de uma sala que nunca
   existiu.

## 2. Sala encerra quando o moderador fica ausente (US1, FR-002)

1. Criar uma sala (aba A, moderador) e entrar com outra pessoa (aba B).
2. Fechar a aba A sem clicar em "sair" (simula queda/esquecimento).
3. Manter a aba B aberta, esperando o ciclo de heartbeat dela detectar a
   ausência do moderador (janela de tolerância de presença já existente,
   10 minutos).
4. **Esperado**: assim que a ausência é detectada, a aba B some da sala com
   a mesma mensagem específica do cenário 1 (não precisa esperar as 4h de
   expiração geral).

## 3. Participante comum sai/fica ausente — sem mudança (US1, FR-004)

1. Sala com moderador (aba A) e dois participantes comuns (abas B e C).
2. Aba B clica em "sair da sala".
3. **Esperado**: aba C continua vendo a sala normalmente, só sem o
   participante da aba B — sem nenhuma mensagem de encerramento.

## 4. Ação não trava a tela indefinidamente (US2, FR-006/FR-007)

1. Com a API real fora do ar (ou rede desligada no meio da chamada), tentar
   entrar numa sala.
2. **Esperado**: em ~10s, a tela sai do estado de carregamento e mostra uma
   mensagem de falha temporária, com o botão disponível para tentar de novo
   — sem precisar de F5.
3. Repetir para votar, revelar e resetar com a sala já em andamento.

## 5. Mensagem de nome duplicado (US4, FR-008)

1. Entrar numa sala com um nome (ex. "Ana").
2. Sem sair, tentar entrar de novo na mesma sala com o mesmo nome ("Ana") a
   partir de outra aba/dispositivo.
3. **Esperado**: a mensagem de erro orienta considerar que pode ser a
   própria tentativa anterior ainda ativa, sugerindo aguardar e tentar de
   novo — não afirma categoricamente que é outra pessoa.

## 6. Moderador remove um participante manualmente (US3, FR-009 a FR-015)

1. Sala com moderador (aba A) e um participante comum (aba B).
2. Na aba A, acionar a remoção do participante da aba B pela lista de
   participantes; confirmar a ação quando solicitado.
3. **Esperado**: aba B some da lista para a aba A; ao ter a tela atualizada,
   a aba B mostra uma mensagem específica de "você foi removido da sala" —
   distinta da mensagem de sala não encontrada/expirada.
4. Verificar que a aba A não tem nenhuma ação de remoção disponível para a
   própria linha dela na lista.
5. Verificar (via chamada direta à API, fora da UI) que um participante
   comum tentando remover outro recebe `NOT_AUTHORIZED` — confirma que a
   ação é exclusiva do moderador (`contracts/api-contract.md`).
