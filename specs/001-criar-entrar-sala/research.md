# Pesquisa Técnica: Criar e Entrar em uma Sala

## 1. Sincronização entre abas (mock de múltiplos participantes)

**Decisão**: `localStorage` como fonte da verdade + `BroadcastChannel` para
notificar outras abas que devem reler o estado.

**Motivo**: `BroadcastChannel` sozinho não persiste estado (só entrega
mensagens a quem está com a aba aberta no momento; uma aba nova não recebe o
histórico). `localStorage` sozinho, com o evento `storage`, não dispara na
própria aba que escreveu (só nas outras) e tem uma latência maior perceptível.
Combinando os dois: toda escrita grava em `localStorage` (persistente, lido
por qualquer aba nova) e emite uma mensagem via `BroadcastChannel` (entrega
quase instantânea para abas já abertas, cumprindo SC-004: <3s).

**Alternativas consideradas**:
- Só `localStorage` + evento `storage`: mais simples, mas não atualiza a
  própria aba que fez a ação sem lógica extra, e tem latência maior em alguns
  navegadores.
- Um mock com estado em memória de um "servidor fake" rodando em processo
  Node local: rejeitado — exigiria manter um processo à parte já nesta fase,
  contradizendo "frontend-first" e adicionando complexidade sem necessidade
  (YAGNI).

## 2. Estilização

**Decisão**: CSS Modules (nativo do Vite, zero dependência nova), replicando
os tokens de cor/tipografia do canvas de design (variáveis CSS: `--bg`,
`--surface`, `--accentA`/`--accentB`, etc.).

**Alternativas consideradas**: Tailwind CSS — rejeitado por agora: exigiria
configuração adicional (PostCSS, purge) para um app com poucas telas; CSS
Modules entrega o mesmo resultado visual com menos peças móveis. Pode ser
revisitado se o número de telas crescer muito.

## 3. Geração de código de sala

**Decisão**: gerar um código curto (6-8 caracteres alfanuméricos) no cliente
via `crypto.getRandomValues`, sem dependência externa.

**Alternativas consideradas**: bibliotecas como `nanoid` — rejeitado por
agora (dependência extra para algo que a Web Crypto API nativa já resolve).
Quando a API real existir, a geração migra para o servidor (garantindo
unicidade global), mas a função pode ser reaproveitada.

## 4. Roteamento

**Decisão**: React Router 6, com rotas `/` (criar sala) e `/sala/:codigo`
(entrar/visualizar sala) — o código da URL é o "link/código único" exigido
pela spec (FR-002/FR-003).

## 5. Limite de inatividade da sala (FR-008)

**Decisão**: uma sala é considerada expirada após **4 horas sem nenhuma
atividade** (ninguém entra, sai, vota, revela ou reseta). Ao tentar acessar
uma sala expirada, o sistema se comporta como se ela não existisse (FR-009).

**Motivo**: sessões de planning poker duram tipicamente de 30 minutos a
2-3 horas; 4 horas dá margem confortável para reuniões que se estendem, sem
deixar salas "zumbis" acumulando por dias. Como o mock usa `localStorage`
(que, ao contrário de memória de processo, persiste indefinidamente entre
sessões do navegador), essa checagem precisa ser feita ativamente ao ler uma
sala — não existe expiração "automática" por si só nesta fase mockada.

**Alternativas consideradas**: expirar só quando o último participante sai
(mais simples, mas não cobre o caso de abas esquecidas abertas sem ninguém
interagir); deixar sem expiração nesta fase (rejeitado — violaria FR-008
diretamente).

## 6. Testes

**Decisão**: Vitest (já integrado ao ecossistema Vite, sem config extra) para
lógica pura em `src/services/`, e React Testing Library para os componentes
de formulário e lista de participantes.

## 7. Nota para o futuro (fora do escopo desta feature)

Quando a API real (Vercel Functions) substituir o mock: funções serverless da
Vercel **não retêm estado em memória entre requisições** — cada chamada é
isolada. Isso significa que, mesmo sendo um estado "efêmero" (constitution,
Princípio IV), ele precisa viver em algum armazenamento acessível entre
requisições para a sala funcionar entre dois participantes diferentes. A
opção mais simples dentro do free tier é um key-value store gratuito (ex.:
Vercel KV / Upstash Redis, camada free) — não um banco relacional completo.
Isso não contradiz "nenhum banco por padrão" (a decisão continua sendo tomada
só quando a feature que liga a API real for planejada), mas é um ponto que
o `/speckit-plan` da integração com API real vai precisar resolver
explicitamente.
