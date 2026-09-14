# Plano de Implementação: Criar e Entrar em uma Sala

**Branch**: `001-criar-entrar-sala` | **Data**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificação da feature em `specs/001-criar-entrar-sala/spec.md`

## Resumo

Construir a tela de criação de sala (nome da sala, nome do criador, escala de
pontos) e a tela de entrada em sala existente (nome do participante), com toda
a lógica de sala/participante/moderador implementada no **frontend com dados
mockados** (sem API real ainda) — sincronizando entre abas do navegador para
simular múltiplos participantes de verdade. A camada de acesso a dados é
isolada atrás de uma interface única, para que a troca por chamadas HTTP reais
(quando a API entrar) não exija reescrever componentes.

## Contexto Técnico

**Linguagem/Versão**: TypeScript 5.x sobre Node.js 20+ (frontend e, futuramente, API)

**Dependências Principais**: React 18, Vite, React Router 6. Nenhuma
biblioteca de UI/animação nesta feature (não há efeitos de carta virando em
001 — isso pertence à spec 002). Estilo via CSS Modules (nativo do Vite, sem
dependência extra), reproduzindo os tokens de cor definidos no canvas de
design.

**Armazenamento**: Nenhum banco de dados. Estado mockado em memória do
processo React + espelhado em `localStorage` (fonte da verdade entre abas) e
sincronizado via `BroadcastChannel` (ver `research.md`).

**Testes**: Vitest (unitário, para a lógica de sala/participante/validação de
nome, independente de UI — Princípio V/VI da constitution) + React Testing
Library (componentes).

**Plataforma Alvo**: Navegador web, desktop e mobile (FR-011/SC-005 exigem
responsivo).

**Tipo de Projeto**: Aplicação web (frontend + API futura) — layout de
projeto único compatível com deploy na Vercel (ver Estrutura abaixo).

**Metas de Performance**: Criar sala e ver o link em <10s (SC-001); entrar e
ver participantes em <15s (SC-002); lista de participantes atualizada em <3s
(SC-004) — alcançável com sincronização local (mock), sem depender de rede.

**Restrições**: Sem custo de infraestrutura (Vercel free tier — constitution,
Restrições Tecnológicas); sem WebSocket persistente; toda entrada do usuário
validada/sanitizada (Princípio VI).

**Escala/Escopo**: ~15 participantes por sala (spec, Suposições); 2 telas
(criar sala, sala com lista de participantes).

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| I. Simplicidade (YAGNI) | PASSA — só criar/entrar/listar; sem conta, sem banco, sem infra nova. |
| II. Sigilo do voto | N/A nesta feature (sem votação); a interface de dados não impede o sigilo em specs futuras. |
| III. Entrega guiada por spec | PASSA — este plano deriva de `spec.md` aprovada. |
| IV. Salas efêmeras/baixa fricção | PASSA — só nome + link, sem cadastro. |
| V. Lógica core testável | PASSA — lógica de sala/participante em `src/services/`, testável via Vitest sem montar UI. |
| VI. Segurança por padrão | PASSA COM NOTA — validação/sanitização de nome de sala/participante desde já; rate limiting e auditoria de dependências só se aplicam quando a API real existir (sem servidor público nesta feature). |
| Restrições Tecnológicas | PASSA — React+Vite, sem banco, sem custo; polling/infra real adiada (mock não faz requisição de rede). |

Nenhuma violação. Tabela de Complexidade não se aplica.

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/001-criar-entrar-sala/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
└── contracts/
    └── api-contract.md  # Fase 1 — contrato que o mock já implementa
```

### Código-fonte (raiz do repositório)

```text
src/
├── components/
│   ├── CreateRoomForm/       # Formulário dos 3 campos (spec US1)
│   ├── JoinRoomForm/         # Formulário de entrada (spec US2)
│   └── ParticipantList/      # Lista ao vivo (spec US3)
├── pages/
│   ├── CreateRoomPage.tsx    # Rota "/"
│   └── RoomPage.tsx          # Rota "/sala/:codigo"
├── services/
│   ├── roomClient.ts         # Interface (contrato) usada pela UI
│   └── mock/
│       ├── mockRoomClient.ts # Implementação mockada (localStorage + BroadcastChannel)
│       └── roomStore.ts      # Lógica pura: criar sala, validar nome, checar duplicidade
├── hooks/
│   ├── useRoom.ts            # Assina mudanças da sala (via roomClient)
│   └── useModerator.ts       # Lê/persiste papel de moderador (localStorage)
├── types/
│   └── room.ts               # Tipos: Sala, Participante, EscalaPontos
├── App.tsx
└── main.tsx

api/                          # Reservado para a API real (Vercel Functions) —
                               # não implementado nesta feature

tests/
├── unit/                     # Vitest: roomStore, validação de nome, moderador
└── components/                # React Testing Library
```

**Decisão de Estrutura**: projeto único na raiz (não `frontend/`+`backend/`
separados), porque a Vercel detecta automaticamente uma pasta `api/` no
mesmo repo do frontend — isso evita duplicar `package.json`/config e mantém
o deploy simples dentro do plano gratuito. `src/services/roomClient.ts` é a
única fronteira que a UI conhece; hoje aponta para `mock/`, no futuro aponta
para `fetch()` contra `api/`.

## Complexity Tracking

Não se aplica — nenhuma violação do Constitution Check.
