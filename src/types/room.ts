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

export type EstadoRodada = "votando" | "revelada";

/**
 * Rodada de votação de uma sala (feature 002). `votos` é um único objeto
 * acessível a todo o código do app — o sigilo do voto (Princípio II) é
 * responsabilidade da camada de apresentação, que nunca deve renderizar
 * `votos[outroParticipanteId]` antes de `estado === 'revelada'` (ver
 * data-model.md §Sigilo e research.md §5).
 */
export interface Rodada {
  estado: EstadoRodada;
  votos: Record<string, string>;
}

export interface Sala {
  codigo: string;
  nome: string;
  escalaPontos: EscalaPontos;
  moderadorId: string;
  participantes: Participante[];
  criadaEm: number;
  ultimaAtividadeEm: number;
  rodada: Rodada;
}

export interface CriarSalaInput {
  nomeSala: string;
  nomeCriador: string;
  escalaPontos: EscalaPontos;
}

/** Resumo derivado da rodada revelada (data-model.md §Resumo pós-revelação). Não é persistido. */
export type ResumoResultado =
  | { tipo: "consenso"; valor: string }
  | { tipo: "dispersao"; min: string; max: string }
  | { tipo: "sem-consenso" };

export interface ResumoRodada {
  votaram: number;
  naoVotaram: Participante[];
  resultado: ResumoResultado;
}

export type ErroRoomClient =
  | "SALA_NAO_ENCONTRADA"
  | "NOME_DUPLICADO"
  | "ENTRADA_INVALIDA"
  | "RODADA_JA_REVELADA"
  | "VALOR_INVALIDO"
  | "APENAS_MODERADOR"
  | "NAO_AUTORIZADO";

export class RoomClientError extends Error {
  constructor(
    public readonly codigo: ErroRoomClient,
    message: string,
  ) {
    super(message);
    this.name = "RoomClientError";
  }
}
