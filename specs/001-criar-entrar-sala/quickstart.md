# Guia de Validação: Criar e Entrar em uma Sala

## Pré-requisitos

- Node.js 20+
- Dependências instaladas: `npm install`

## Rodar em desenvolvimento

```bash
npm run dev
```

Abre o app em `http://localhost:5173` (padrão do Vite).

## Rodar os testes automatizados

```bash
npm test
```

Deve cobrir, no mínimo: validação de nome (sala/participante), rejeição de
nome duplicado (FR-006), e persistência do papel de moderador após reload
(FR-010) — tudo em `src/services/`, sem precisar montar componentes de UI.

## Cenário de validação manual (ponta a ponta)

1. Abra `http://localhost:5173` em uma aba.
2. Preencha nome da sala, seu nome, e escolha uma escala de pontos → **Criar
   sala**. Confirme que é redirecionado para `/sala/<codigo>` como moderador.
3. Copie a URL da barra de endereço.
4. Abra essa URL em **uma segunda aba** (mesmo navegador).
5. Informe um nome diferente e entre na sala.
6. Confirme que **ambas as abas** mostram os dois participantes na lista, em
   até poucos segundos (SC-004) — prova que a sincronização entre abas
   (localStorage + BroadcastChannel) está funcionando.
7. Na segunda aba, tente entrar novamente repetindo o mesmo nome já usado na
   primeira — deve ser rejeitado (FR-006).
8. Na primeira aba (moderador), dê F5 — confirme que ainda é reconhecido como
   moderador da mesma sala (FR-010), sem precisar recriar a sala.
9. Redimensione a janela para uma largura de celular (ou use o modo
   responsivo do DevTools) e repita os passos 2 e 5 — a interface deve
   permanecer usável sem zoom/rolagem horizontal (FR-011/SC-005).
10. Tente acessar uma URL `/sala/codigo-invalido` — deve exibir mensagem de
    sala não encontrada, sem quebrar a aplicação (FR-009).

Se todos os passos acima se comportarem como descrito, a feature está pronta
para revisão de segurança (`security-review`) antes de considerar concluída
(Princípio VI da constitution).
