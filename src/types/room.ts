export type EscalaPontos = "fibonacci" | "sequencial" | "camisetas";

export const ESCALAS_PONTOS: Record<EscalaPontos, string[]> = {
  fibonacci: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"],
  sequencial: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  camisetas: ["PP", "P", "M", "G", "GG"],
};

export const ESCALAS_PONTOS_LABEL: Record<EscalaPontos, string> = {
  fibonacci: "Fibonacci modificado",
  sequencial: "Sequencial (1–10)",
  camisetas: "Camisetas (PP–GG)",
};

export interface Participante {
  id: string;
  nome: string;
  ehModerador: boolean;
  entrouEm: number;
}

export interface Sala {
  codigo: string;
  nome: string;
  escalaPontos: EscalaPontos;
  moderadorId: string;
  participantes: Participante[];
  criadaEm: number;
  ultimaAtividadeEm: number;
}

export interface CriarSalaInput {
  nomeSala: string;
  nomeCriador: string;
  escalaPontos: EscalaPontos;
}

export type ErroRoomClient = "SALA_NAO_ENCONTRADA" | "NOME_DUPLICADO" | "ENTRADA_INVALIDA";

export class RoomClientError extends Error {
  constructor(
    public readonly codigo: ErroRoomClient,
    message: string,
  ) {
    super(message);
    this.name = "RoomClientError";
  }
}
