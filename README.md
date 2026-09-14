# PokerFlow

Planning Poker simples e sem fricção para refinamento de times Scrum: crie uma
sala, compartilhe o link, vote com sigilo e revele as estimativas do time —
sem cadastro, sem senha, sem e-mail.

**Autor**: Junior Salzano

## Como funciona

1. Alguém cria uma sala informando o nome da sala, o próprio nome e a escala
   de pontos (Fibonacci modificado, Sequencial ou Camisetas).
2. O time entra na sala só com um link e um nome.
3. Cada participante vota em uma carta; o valor fica oculto para os demais
   até a revelação.
4. O moderador (quem criou a sala) revela os votos de todos ao mesmo tempo e
   pode resetar a rodada para uma nova votação.

## Status do projeto

Em desenvolvimento, guiado por especificações (Spec-Driven Development via
[Spec Kit](https://github.com/github/spec-kit)). Veja o [`ROADMAP.md`](ROADMAP.md)
para o fluxo de trabalho e o andamento de cada feature, e `specs/` para as
especificações detalhadas.

Design de referência (logo, paleta e mockups das telas):
https://claude.ai/code/artifact/3b8854f3-4ca8-47b6-8dca-24a6f018325b

## Stack

- Frontend: React + Vite
- Backend: Node.js
- Tempo real: WebSocket (ou equivalente) para sincronizar o estado da sala

Sem banco de dados por padrão — o estado da sala é efêmero. Ver
[`.specify/memory/constitution.md`](.specify/memory/constitution.md) para as
regras e restrições do produto.

## Desenvolvimento

Este projeto segue o fluxo do Spec Kit: toda feature nasce de uma spec
(`/speckit-specify`) antes de virar plano (`/speckit-plan`), tarefas
(`/speckit-tasks`) e código (`/speckit-implement`). Detalhes em
[`CLAUDE.md`](CLAUDE.md) e [`ROADMAP.md`](ROADMAP.md).
