import { useCallback, useState } from "react";
import { roomClient } from "../services/roomClient";
import { RoomClientError } from "../types/room";

function mensagemErro(e: unknown, fallback: string): string {
  return e instanceof RoomClientError ? e.message : fallback;
}

/**
 * Ações da rodada de votação (votar/revelar/resetar). O estado atualizado da
 * sala não é devolvido por este hook — quem chama já está inscrito em
 * `useRoom`/`roomClient.assinarSala`, que recebe a atualização em tempo real
 * assim que o mock persiste a mudança (mesmo padrão de useCreateRoom/useJoinRoom).
 */
export function useRodada(codigo: string | undefined, participanteId: string | undefined) {
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const votar = useCallback(
    async (valor: string) => {
      if (!codigo || !participanteId) return;
      setErro(null);
      setCarregando(true);
      try {
        await roomClient.votar(codigo, participanteId, valor);
      } catch (e) {
        setErro(mensagemErro(e, "Não foi possível registrar seu voto. Tente novamente."));
      } finally {
        setCarregando(false);
      }
    },
    [codigo, participanteId],
  );

  const revelar = useCallback(async () => {
    if (!codigo || !participanteId) return;
    setErro(null);
    try {
      await roomClient.revelar(codigo, participanteId);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível revelar os votos. Tente novamente."));
    }
  }, [codigo, participanteId]);

  const resetar = useCallback(async () => {
    if (!codigo || !participanteId) return;
    setErro(null);
    try {
      await roomClient.resetar(codigo, participanteId);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível resetar a rodada. Tente novamente."));
    }
  }, [codigo, participanteId]);

  return { votar, revelar, resetar, erro, carregando };
}
