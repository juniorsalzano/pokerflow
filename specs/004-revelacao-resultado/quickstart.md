# Quickstart — Validação: Painel Central da Mesa e Revelação de Resultado

Feature majoritariamente visual (transições, confete) — a validação é
principalmente manual, no navegador, em duas abas para simular múltiplos
participantes (mesmo padrão já usado nas specs 001/002). A lógica pura
(`agruparPorValor`, `avatarDe`) tem cobertura automatizada (ver §3).

## Pré-requisitos

- Dependências instaladas: `npm install` (inclui `canvas-confetti` após
  implementada a Fase 2/3 desta feature).
- Servidor de dev rodando: `npm run dev`.
- Duas abas do navegador na mesma sala (crie a sala numa aba, copie o link
  "Convidar time" e abra na outra) — necessário porque o mock sincroniza
  entre abas via `localStorage`/`storage` event (ver CLAUDE.md, "Como o mock
  simula múltiplos participantes").

## 1. Painel central como status (História 1)

1. Crie uma sala com pelo menos 2 participantes (duas abas).
2. **Esperado**: acima da grade de participantes, um painel central exibe uma
   mensagem de status simples (ex.: instrução para votar). Grade de
   participantes continua lado a lado (não circular).
3. Redimensione a janela para largura de mobile (~375px). **Esperado**:
   painel central e grade continuam legíveis, sem quebra de layout.

## 2. Revelar com contador e verso de carta (História 2)

1. Ambos os participantes votam (valores diferentes).
2. **Esperado, antes de revelar**: a carta de cada participante que já votou
   mostra uma textura de verso de carta (não uma área lisa/vazia) para quem
   não é o dono do voto.
3. O moderador clica em "Revelar".
4. **Esperado**: uma contagem regressiva (3, 2, 1) aparece no painel central
   antes de qualquer carta virar. Ao final, as cartas viram no lugar, na
   grade, revelando os valores (igual ao comportamento já existente da spec
   002, só que agora precedido pelo contador).

## 3. Resultado agrupado por valor (História 3)

Pré-requisito automatizado: `npm run test -- agruparPorValor` (ou o caminho
do arquivo de teste da função) deve passar antes de validar visualmente —
cobre: agrupamento correto por valor, participantes que não votaram excluídos
dos grupos, caso "ninguém votou" retorna grupos vazios.

1. Continuando do passo anterior (cartas já reveladas na grade).
2. **Esperado**: alguns instantes depois, as cartas se transformam (uma a
   uma, não todas de uma vez) num painel de resultado que ocupa o lugar
   delas, agrupando os participantes por valor votado — cada participante
   aparece como um avatar (círculo com iniciais) no grupo do valor que
   escolheu.
3. Repita a rodada com um participante que **não vota** antes do reveal.
   **Esperado**: o painel de resultado indica textualmente quantos ficaram de
   fora; esse participante não aparece em nenhum grupo.
4. Repita uma rodada em que **ninguém vota**. **Esperado**: painel de
   resultado mostra um estado vazio claro, sem grupos quebrados/vazios e sem
   confete.

## 4. Confete no consenso (História 5)

1. Faça todos os participantes votarem o **mesmo valor**.
2. O moderador revela.
3. **Esperado**: no instante em que o painel de resultado agrupado aparece
   (todos os avatares no mesmo grupo), um burst de confete curto é exibido e
   desaparece sozinho em poucos segundos — sem exigir clique.
4. Repita com votos **divergentes**. **Esperado**: nenhum confete.

## 5. Resetar com transição de volta (História 4)

1. Com o painel de resultado visível (de qualquer cenário acima), o
   moderador clica em "Resetar".
2. **Esperado**: o painel de resultado transiciona de volta para cartas
   individuais, carta a carta, nas posições da grade; o painel central volta
   a mostrar a mensagem de status de votação.
3. Ambos os participantes conseguem votar na nova rodada sem recarregar a
   página.
4. **Caso de borda**: clique em "Resetar" repetidas vezes rapidamente, e
   também durante a contagem regressiva de uma revelação seguinte (antes dela
   terminar). **Esperado**: a interface sempre se recompõe de forma
   consistente — sem elementos duplicados, sem travar.

## 6. Regressão rápida

- Confirme que o fluxo de votar/trocar de voto antes de revelar (spec 002)
  continua funcionando sem alteração de comportamento.
- Confirme que o botão "Sair da sala" e "Convidar time" (topbar) continuam
  funcionando normalmente — esta feature não os toca.
- Rode a suíte automatizada completa: `npm run test`.

## 7. Antes de considerar a feature concluída

Rodar `security-review` sobre o diff desta feature (Princípio VI da
constitution) — expectativa é superfície mínima (sem input novo, sem
endpoint novo), mas a checagem é padrão do projeto, não opcional.
