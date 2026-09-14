import { useCallback, useState } from "react";
import { roomClient } from "../services/roomClient";
import { RoomClientError } from "../types/room";

export function useJoinRoom(codigo: string) {
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const entrar = useCallback(
    async (nomeParticipante: string): Promise<{ participanteId: string } | undefined> => {
      setErro(null);
      setCarregando(true);
      try {
        const { participanteId } = await roomClient.entrarNaSala(codigo, nomeParticipante);
        return { participanteId };
      } catch (e) {
        if (e instanceof RoomClientError) {
          setErro(e.message);
        } else {
          setErro("Não foi possível entrar na sala. Tente novamente.");
        }
        return undefined;
      } finally {
        setCarregando(false);
      }
    },
    [codigo],
  );

  return { entrar, erro, carregando };
}
