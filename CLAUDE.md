# PokerFlow

Ferramenta de Planning Poker para times Scrum: criar sala, entrar, votar, revelar.

## Stack

- Frontend: React + Vite
- Backend: Node.js
- Comunicação em tempo real: WebSocket (ou equivalente) para sincronizar estado da sala
- Sem banco de dados por padrão (estado de sala é efêmero) — só adicionar persistência se uma spec exigir

## Regras do produto

As regras de negócio inegociáveis (sigilo do voto, salas sem conta/senha, YAGNI, etc.)
estão em `.specify/memory/constitution.md`. Consulte esse arquivo antes de propor
qualquer mudança de escopo ou arquitetura.

## Fluxo de trabalho: Spec-Driven Development (Spec Kit)

Nenhum código de aplicação é escrito sem passar por esse fluxo (exceto trivialidades
como typo/formatação). Ordem:

1. `/speckit-constitution` — só quando for alterar as regras fundamentais do projeto
   (já feito, ver `.specify/memory/constitution.md`).
2. `/speckit-specify <descrição da feature>` — cria `specs/<NNN>-<slug>/spec.md`.
3. `/speckit-clarify` (opcional) — resolve ambiguidades na spec com perguntas.
4. `/speckit-plan` — gera `plan.md` (e research.md/data-model.md/contracts/ quando
   necessário) dentro da mesma pasta da feature.
5. `/speckit-checklist` (opcional) — checklist de qualidade da spec/plano.
6. `/speckit-tasks` — gera `tasks.md` com a lista de tarefas ordenadas por dependência.
7. `/speckit-analyze` (opcional) — checa consistência entre spec/plan/tasks.
8. `/speckit-implement` — executa as tarefas e escreve o código de fato.

Cada feature vira uma pasta própria em `specs/<NNN>-<slug>/`.

## Estratégia de implementação: frontend primeiro, com mocks

Nesta fase, o desenvolvimento é **frontend-first**: toda funcionalidade que
dependeria de uma API/backend real (criar sala, entrar, votar, revelar,
resetar, WebSocket) deve ser implementada no frontend usando **dados e
chamadas mockadas** (ex.: um módulo de mock/fixture local, sem servidor real
respondendo). O objetivo é validar a experiência e o visual antes de construir
o backend.

Quando o backend (Node.js + WebSocket) for implementado depois, as rotas reais
substituem os mocks — a interface de dados usada pelo frontend deve ser
desenhada de um jeito que troque a implementação mockada pela real sem
reescrever os componentes (ex.: uma camada de "cliente de API" isolada).

Isso deve ser refletido no `/speckit-plan` de cada feature: a fase de
implementação do frontend vem primeiro (com mock), a integração com a API
real é uma etapa posterior explícita.

**Como o mock simula múltiplos participantes**: já que ainda não há backend/
WebSocket real, o mock deve sincronizar de fato entre abas do navegador (ex.:
`localStorage` + evento `storage`, ou `BroadcastChannel`) para que abrir a
mesma sala em duas abas simule dois participantes reais votando — não apenas
dados fixos/fake na tela. Isso permite testar o fluxo completo (entrar, votar,
revelar, resetar) antes de existir servidor.

**Persistência local**: a identidade de moderador de uma sala deve sobreviver
a um recarregamento de página (F5) nesta fase mockada — guardar localmente
(ex.: `localStorage`) qual sala e papel (moderador/participante) o usuário
tem, para não perder o controle de revelar/resetar ao dar refresh.

## Idioma

- Artefatos do Spec Kit (spec.md, plan.md, tasks.md, checklists) → **português (pt-BR)**.
- Código, nomes de variáveis/arquivos, comentários e commits → **inglês**.

(Definido em `.specify/memory/constitution.md`, seção "Documentation Language".)
