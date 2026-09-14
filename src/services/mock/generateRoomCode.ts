const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789"; // sem 0/o/1/l/i, evita ambiguidade visual
const TAMANHO = 7;

/**
 * Gera um código curto e legível para a sala usando a Web Crypto API nativa
 * (sem dependência externa — ver research.md §3). Quando a API real existir,
 * a geração migra para o servidor, mas esta função pode ser reaproveitada.
 */
export function generateRoomCode(): string {
  const valores = new Uint32Array(TAMANHO);
  crypto.getRandomValues(valores);
  let codigo = "";
  for (let i = 0; i < TAMANHO; i++) {
    codigo += ALFABETO[valores[i] % ALFABETO.length];
  }
  return codigo;
}
