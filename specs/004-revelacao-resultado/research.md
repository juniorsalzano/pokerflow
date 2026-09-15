# Fase 0 — Pesquisa: Painel Central da Mesa e Revelação de Resultado

## §1. Biblioteca de confete

**Decisão**: usar [`canvas-confetti`](https://www.npmjs.com/package/canvas-confetti)
(~3kb gzip, zero dependências), importada dinamicamente (`import()`) só no
momento em que a rodada revela consenso total — não entra no bundle inicial
da tela da sala.

**Motivo**: a spec (FR-008) pede um efeito de "burst" curto, não confete
contínuo caindo na tela. `canvas-confetti` é feita exatamente para isso (API
de disparo único, `confetti({ particleCount, spread, origin })`), amplamente
usada, leve e sem dependências transitivas. Escrever um sistema de partículas
próprio para um efeito puramente decorativo seria o tipo de esforço
redundante que o Princípio I (YAGNI) da constitution pede para evitar.

**Alternativas consideradas**:
- `react-confetti`: pensada para confete contínuo cobrindo a tela
  (redimensiona com a janela, cai continuamente) — pior encaixe para um burst
  curto, e mais pesada.
- `react-confetti-explosion`: também resolveria, mas tem comunidade/manutenção
  menor que `canvas-confetti`, que é o padrão de fato do ecossistema JS para
  esse efeito.
- Implementação própria (CSS/canvas manual): rejeitada — reinventa um
  problema já resolvido, para um elemento puramente cosmético (História 5,
  P3, a de menor prioridade da feature).

## §2. Orquestração das transições (contador, flip, transformação pro resultado, reset)

**Decisão**: usar CSS (transitions/keyframes) orquestradas por um pequeno
estado de fase em React — sem adicionar biblioteca de animação
(Framer Motion, react-spring, react-transition-group).

**Motivo**: o projeto já resolve exatamente esse tipo de problema hoje em
`SeatCard` — o flip 3D de revelação usa `transform: rotateY()` com
`transitionDelay: ${indice * 60}ms` calculado em JS para escalonar a entrada
por participante (ver `SeatCard.tsx`/`SeatCard.module.css`, spec 002). As
transições novas desta feature (contador aparecendo/sumindo, cartas se
transformando no painel de resultado e voltando) são do mesmo tipo: uma
sequência de estados visuais com atraso escalonado por índice, que CSS
transitions/keyframes resolvem bem quando combinadas com uma máquina de fases
simples no React (`useRevelacaoTransicao`, ver data-model.md). Adicionar uma
biblioteca de animação de ~40kb+ (Framer Motion) para um padrão que o projeto
já resolve com sucesso, numa base de código que hoje tem zero dependências de
animação, não se justifica sob o Princípio I.

**Alternativas consideradas**:
- Framer Motion: rejeitada — peso de bundle não justificado; o padrão CSS já
  existente cobre o necessário (staggered enter/exit, sequenciamento por
  estado).
- react-transition-group: rejeitada — adiciona uma camada de abstração sobre
  algo que `useState`/`useEffect` + CSS já resolvem neste projeto sem
  problemas conhecidos.

## §3. Máquina de fases da revelação

**Decisão**: um hook local (`useRevelacaoTransicao`, escopo de UI, não de
domínio) com fases explícitas:

```text
"votando" → (moderador revela) → "contagem" → "virando" → "resultado"
"resultado" → (moderador reseta) → "voltando" → "votando"
```

Esse hook observa `sala.rodada.estado` (já existente, spec 002) e traduz a
mudança de "votando" → "revelada" no lado do servidor/mock em uma sequência
de fases *locais* de apresentação (contagem → virando → resultado), com
temporizadores (`setTimeout`) entre elas. O reset (`sala.rodada.estado`
voltando para "votando") dispara a fase "voltando" e depois "votando". Isso
mantém a máquina de estados real da rodada (Princípio V, já testada na spec
002) intocada — esta feature só adiciona uma camada de apresentação por cima
dela.

**Motivo**: a spec (FR-014) exige que reset a qualquer momento durante uma
transição recomponha a interface sem travar. Uma máquina de fases explícita
com um número finito de estados é mais simples de tornar "reset-safe" (basta
que o evento de reset force a fase para "voltando" a partir de qualquer fase
atual, cancelando timers pendentes) do que tentar coordenar animações
imperativas soltas.

**Alternativas consideradas**: nenhuma — para um número pequeno e fixo de
fases sequenciais, uma máquina de estados simples é a abordagem padrão; não
há disputa técnica real aqui.

## §4. Timing por cliente vs. sincronização entre abas

**Decisão**: a contagem regressiva e as transições visuais rodam localmente
em cada aba/cliente, disparadas pela mudança já sincronizada de
`sala.rodada.estado` (mock via `storage` event, ou API real via polling,
spec 003) — não há necessidade de sincronizar o *frame exato* da animação
entre participantes.

**Motivo**: a spec não exige que o contador apareça no mesmo milissegundo em
todas as telas — exige que, ao final da transição, todos cheguem ao mesmo
estado final (cartas reveladas, depois resultado agrupado). Isso já é
garantido porque todos os clientes reagem à mesma mudança de
`rodada.estado`/`rodada.votos` vinda do mock/API. Pequenas diferenças de
timing entre abas (ex.: uma rede um pouco mais lenta no polling) são
aceitáveis e não violam nenhum requisito da spec 004 nem o sigilo do voto
(Princípio II, inalterado por esta feature).

**Alternativas consideradas**: sincronizar o exato instante da contagem via
timestamp do servidor — rejeitada por complexidade desnecessária (YAGNI);
nenhum requisito da spec pede esse nível de precisão.

## §5. Iniciais e cor do avatar

**Decisão**: função pura `iniciais(nome: string): string` (primeira letra do
primeiro e do último "token" do nome, maiúsculas) e uma cor determinística
derivada de um hash simples do nome/id do participante, dentro da paleta de
cores já definida do PokerFlow (variáveis CSS `--accent-a`/`--accent-b`/
tons já usados em `SeatCard`) — sem gerar cores fora da identidade visual.

**Motivo**: FR-003/FR-007/FR-010 exigem avatares com iniciais (não fotos,
já que o produto não tem contas) e nenhuma cor fora da paleta do produto. Uma
função pura e determinística é trivialmente testável e não exige nenhuma
dependência nova.

**Alternativas consideradas**: biblioteca de geração de avatar (ex.:
`boring-avatars`) — rejeitada, YAGNI: o requisito é simples o bastante (letra
+ cor da paleta) para não justificar uma dependência nova.
