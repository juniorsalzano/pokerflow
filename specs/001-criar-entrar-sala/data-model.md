# Modelo de Dados: Criar e Entrar em uma Sala

## Sala

| Campo | Tipo | Regras |
|---|---|---|
| `codigo` | string | Identificador único da sala (6-8 caracteres alfanuméricos), usado na URL (`/sala/:codigo`). Gerado na criação. |
| `nome` | string | Obrigatório, 1-60 caracteres, sanitizado (sem HTML/script) — FR-001. |
| `escalaPontos` | `'fibonacci' \| 'sequencial' \| 'camisetas'` | Obrigatório, um dos 3 valores pré-definidos — FR-002a. Imutável após a criação nesta feature. |
| `moderadorId` | string | Referência ao `id` do participante criador — FR-005. |
| `participantes` | `Participante[]` | Lista de participantes ativos na sala. |
| `criadaEm` | timestamp | Momento da criação. |
| `ultimaAtividadeEm` | timestamp | Atualizado a cada ação (entrar/sair); usado para a expiração por inatividade — FR-008 (o valor exato do período fica a critério da implementação; ver Suposições da spec). |

## Participante

| Campo | Tipo | Regras |
|---|---|---|
| `id` | string | Identificador único gerado no cliente ao entrar (ex.: UUID). |
| `nome` | string | Obrigatório, 1-30 caracteres, sanitizado, único **dentro da sala** (case-insensitive) — FR-006. |
| `ehModerador` | boolean | `true` apenas para quem criou a sala — FR-005. |
| `entrouEm` | timestamp | Momento em que entrou na sala. |

## Regras de validação (derivadas dos Requisitos Funcionais)

- Nome da sala e nome do participante: campo obrigatório, tamanho mínimo 1
  após `trim()`, tamanho máximo (60 para sala, 30 para participante),
  sanitizado antes de exibir/armazenar (Princípio VI da constitution).
- Nome do participante duplicado (case-insensitive) na mesma sala: rejeitado
  com mensagem clara, sem criar o participante — FR-006.
- Código de sala inexistente: retorna "sala não encontrada" sem detalhes
  técnicos — FR-009.

## Ciclo de vida da Sala (transições relevantes a esta feature)

```
(inexistente) --criar sala--> Ativa
Ativa --participante entra--> Ativa (lista atualizada)
Ativa --participante sai/desconecta--> Ativa (lista atualizada) | Vazia
Ativa --sem atividade por X--> Encerrada (descartada, FR-008)
```

Transições de votação/revelação/reset pertencem à spec 002 e não são
modeladas aqui.

## Persistência local (mock)

- `localStorage["pokerflow:sala:<codigo>"]` → objeto `Sala` serializado
  (fonte da verdade entre abas).
- `sessionStorage["pokerflow:eu:<codigo>"]` → `{ participanteId, ehModerador }`
  do usuário desta aba para aquela sala específica — permite que um refresh
  (F5) reconheça o mesmo participante e, se aplicável, o papel de moderador
  (FR-010). Deliberadamente **sessionStorage, não localStorage**: precisa
  sobreviver a F5 na mesma aba, mas NÃO deve ser compartilhado entre abas —
  do contrário, abrir a mesma sala em uma segunda aba do mesmo navegador
  reconheceria incorretamente a pessoa como o mesmo participante/moderador
  da primeira aba (bug encontrado ao validar a feature manualmente).
