import { useCallback, useState } from "react";
import { roomClient } from "../services/roomClient";
import { RoomClientError } from "../types/room";

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof RoomClientError ? e.message : fallback;
}

/**
 * Voting round actions (vote/reveal/reset). The updated room state isn't
 * returned by this hook — the caller is already subscribed via
 * `useRoom`/`roomClient.subscribeToRoom`, which receives the real-time
 * update as soon as the mock persists the change (same pattern as
 * useCreateRoom/useJoinRoom).
 */
export function useRound(code: string | undefined, participantId: string | undefined) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const vote = useCallback(
    async (value: string) => {
      if (!code || !participantId) return;
      setError(null);
      setLoading(true);
      try {
        await roomClient.vote(code, participantId, value);
      } catch (e) {
        setError(errorMessage(e, "Não foi possível registrar seu voto. Tente novamente."));
      } finally {
        setLoading(false);
      }
    },
    [code, participantId],
  );

  const reveal = useCallback(async () => {
    if (!code || !participantId) return;
    setError(null);
    try {
      await roomClient.reveal(code, participantId);
    } catch (e) {
      setError(errorMessage(e, "Não foi possível revelar os votos. Tente novamente."));
    }
  }, [code, participantId]);

  const reset = useCallback(async () => {
    if (!code || !participantId) return;
    setError(null);
    try {
      await roomClient.reset(code, participantId);
    } catch (e) {
      setError(errorMessage(e, "Não foi possível resetar a rodada. Tente novamente."));
    }
  }, [code, participantId]);

  return { vote, reveal, reset, error, loading };
}
