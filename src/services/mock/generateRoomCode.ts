const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l/i, avoids visual ambiguity
const LENGTH = 7;

/**
 * Generates a short, readable room code using the native Web Crypto API
 * (no external dependency — see research.md §3). When the real API exists,
 * generation moves to the server, but this function can be reused.
 */
export function generateRoomCode(): string {
  const values = new Uint32Array(LENGTH);
  crypto.getRandomValues(values);
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[values[i] % ALPHABET.length];
  }
  return code;
}
