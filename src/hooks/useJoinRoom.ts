import { useCallback, useState } from "react";
import { roomClient } from "../services/roomClient";
import { RoomClientError } from "../types/room";

export function useJoinRoom(code: string) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const join = useCallback(
    async (participantName: string): Promise<{ participantId: string; token?: string } | undefined> => {
      setError(null);
      setLoading(true);
      try {
        const { participantId, token } = await roomClient.joinRoom(code, participantName);
        return { participantId, token };
      } catch (e) {
        if (e instanceof RoomClientError) {
          // DUPLICATE_NAME (spec 005, FR-008): quem trava numa tentativa
          // anterior (User Story 2) e tenta de novo com o mesmo nome bate
          // nesse erro contra a própria sessão fantasma, não
          // necessariamente contra outra pessoa — a mensagem do servidor
          // ("já existe alguém com esse nome") afirma categoricamente que é
          // outra pessoa, o que é enganoso nesse caso. Sobrescrita aqui, só
          // para este fluxo, sem precisar diferenciar as duas situações no
          // backend (research.md, decisão implícita da User Story 4).
          setError(
            e.code === "DUPLICATE_NAME"
              ? "Esse nome já está em uso nessa sala — pode ser uma tentativa sua anterior, ainda ativa. Aguarde um pouco e tente de novo, ou entre com outro nome."
              : e.message,
          );
        } else {
          setError("Não foi possível entrar na sala. Tente novamente.");
        }
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [code],
  );

  return { join, error, loading };
}
