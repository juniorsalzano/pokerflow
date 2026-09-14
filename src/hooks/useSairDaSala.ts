import { useCallback } from "react";
import { roomClient } from "../services/roomClient";

/**
 * Ação explícita de sair da sala (US3, spec 001) — melhor esforço: se a
 * chamada falhar (rede instável, ex.), não bloqueia a saída da tela; o
 * servidor remove o participante de qualquer forma pela expiração por
 * inatividade (mesmo padrão de tolerância a falha do `usePresenca`).
 */
export function useSairDaSala(codigo: string | undefined, participanteId: string | undefined) {
  return useCallback(async () => {
    if (!codigo || !participanteId) return;
    try {
      await roomClient.sairDaSala(codigo, participanteId);
    } catch {
      // melhor esforço — ver comentário acima.
    }
  }, [codigo, participanteId]);
}
