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
          setError(e.message);
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
