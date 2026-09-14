import { CriarSalaInput, Participante, Sala } from "../types/room";

/**
 * Fronteira única entre a UI e a fonte de dados (contracts/api-contract.md).
 * Hoje implementada por mock/mockRoomClient.ts; quando a API real existir,
 * uma implementação http/httpRoomClient.ts segue exatamente este contrato.
 */
export interface RoomClient {
  criarSala(input: CriarSalaInput): Promise<{ codigo: string; sala: Sala; token?: string }>;

  entrarNaSala(
    codigo: string,
    nomeParticipante: string,
  ): Promise<{ participanteId: string; sala: Sala; token?: string }>;

  obterSala(codigo: string): Promise<Sala | null>;

  assinarSala(codigo: string, callback: (sala: Sala | null) => void): () => void;

  sairDaSala(codigo: string, participanteId: string): Promise<void>;

  votar(codigo: string, participanteId: string, valor: string): Promise<Sala>;

  revelar(codigo: string, participanteId: string): Promise<Sala>;

  resetar(codigo: string, participanteId: string): Promise<Sala>;
}

export type { Participante, Sala };

// Ponto único de wiring: usa a API real (http/httpRoomClient.ts) quando
// VITE_API_BASE_URL está definida; senão cai no mock — nenhum componente
// muda em nenhum dos dois casos (feature 003).
import { mockRoomClient } from "./mock/mockRoomClient";
import { httpRoomClient } from "./http/httpRoomClient";

export const roomClient: RoomClient = import.meta.env.VITE_API_BASE_URL ? httpRoomClient : mockRoomClient;
