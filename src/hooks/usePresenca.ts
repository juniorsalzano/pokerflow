import { useEffect } from "react";
import { roomClient } from "../services/roomClient";

const INTERVALO_PRESENCA_MS = 45_000;

/**
 * Sinal periódico de presença (FR-010) enquanto a sala está aberta —
 * substitui a antiga saída automática no `beforeunload`, que contradizia a
 * US3 (reconectar sem perder identidade). Uma falha isolada (rede, 401) é
 * ignorada silenciosamente aqui: só a ausência repetida por 10 minutos
 * seguidos (do lado do servidor, FR-011) tira alguém da sala — um heartbeat
 * perdido não deve derrubar a sessão do usuário.
 */
export function usePresenca(codigo: string | undefined, participanteId: string | undefined): void {
  useEffect(() => {
    if (!codigo || !participanteId) return;

    const intervalo = setInterval(() => {
      roomClient.enviarPresenca(codigo, participanteId).catch(() => {});
    }, INTERVALO_PRESENCA_MS);

    return () => clearInterval(intervalo);
  }, [codigo, participanteId]);
}
