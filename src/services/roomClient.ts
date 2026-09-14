import { CriarSalaInput, Participante, Sala } from "../types/room";

/**
 * Fronteira única entre a UI e a fonte de dados (contracts/api-contract.md).
 * Hoje implementada por mock/mockRoomClient.ts; quando a API real existir,
 * uma implementação http/httpRoomClient.ts segue exatamente este contrato.
 */
export interface RoomClient {
  criarSala(input: CriarSalaInput): Promise<{ codigo: string; sala: Sala }>;

  entrarNaSala(
    codigo: string,
    nomeParticipante: string,
  ): Promise<{ participanteId: string; sala: Sala }>;

  obterSala(codigo: string): Promise<Sala | null>;

  assinarSala(codigo: string, callback: (sala: Sala | null) => void): () => void;

  sairDaSala(codigo: string, participanteId: string): Promise<void>;

  votar(codigo: string, participanteId: string, valor: string): Promise<Sala>;

  revelar(codigo: string, participanteId: string): Promise<Sala>;

  resetar(codigo: string, participanteId: string): Promise<Sala>;
}

export type { Participante, Sala };

// Ponto único de wiring: hoje aponta para o mock; quando a API real existir
// (Vercel Functions em api/), troca-se apenas esta linha por uma implementação
// http/httpRoomClient.ts que siga o mesmo contrato — nenhum componente muda.
import { mockRoomClient } from "./mock/mockRoomClient";
export const roomClient: RoomClient = mockRoomClient;
