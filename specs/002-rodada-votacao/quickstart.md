# Guia de Validação: Rodada de Votação

## Pré-requisitos

Mesmos de 001: `npm install`, depois `npm run dev`.

## Rodar os testes automatizados

```bash
npm test
```

Deve cobrir: votar e trocar de voto antes do reveal, rejeição de voto após
revelar, valor fora da escala rejeitado, apenas moderador revela/reseta,
cálculo de consenso/dispersão, e (herdado de 001) isolamento entre salas
simultâneas.

## Cenário de validação manual (ponta a ponta)

Continua do roteiro de `specs/001-criar-entrar-sala/quickstart.md` (duas
abas, sala já criada com dois participantes).

1. Na aba do participante (não-moderador), clique em uma carta da escala —
   confirme retorno visual imediato (carta destacada) e que **você continua
   vendo seu próprio valor**.
2. Na aba do moderador, confirme que vê apenas a indicação "já votou" do
   outro participante, sem o valor.
3. Ainda sem revelar, clique em outra carta no participante — confirme que
   o voto troca livremente.
4. Na aba do moderador, clique em **Revelar** — confirme que os valores de
   todos aparecem para as duas abas, com o efeito de virar, e que o resumo
   (consenso ou dispersão) aparece corretamente.
5. Tente clicar em outra carta em qualquer aba — confirme que não é mais
   possível alterar o voto.
6. Confirme que o participante comum não vê os botões Revelar/Resetar.
7. Na aba do moderador, clique em **Resetar** — confirme que os votos somem
   e uma nova rodada de votação oculta começa para ambos, sem recriar a
   sala.
8. Repita o passo 1-4 em uma escala diferente (ex.: "Camisetas") — confirme
   que o resumo mostra "Sem consenso" em vez de tentar calcular uma faixa
   numérica.
9. (Herdado de 001) Confirme responsividade em viewport mobile.

Se todos os passos se comportarem como descrito, a feature está pronta para
`security-review` antes de considerá-la concluída (Princípio VI).
