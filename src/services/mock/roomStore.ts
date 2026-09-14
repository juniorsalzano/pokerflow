import { generateRoomCode } from "./generateRoomCode";
import { nomesIguaisCaseInsensitive, validarNomeParticipante, validarNomeSala } from "./validation";
import { CriarSalaInput, Participante, RoomClientError, Sala } from "../../types/room";

/** Limite de inatividade após o qual uma sala é tratada como expirada (FR-008, research.md §5). */
export const LIMITE_INATIVIDADE_MS = 4 * 60 * 60 * 1000;

function novoId(): string {
  return crypto.randomUUID();
}

/**
 * Lógica pura de criação de sala (FR-001/FR-002/FR-002a/FR-002b/FR-005).
 * Sem I/O — quem chama decide onde persistir o resultado.
 */
export function criarSala(input: CriarSalaInput, agora: number = Date.now()): Sala {
  const nomeSala = validarNomeSala(input.nomeSala);
  const nomeCriador = validarNomeParticipante(input.nomeCriador);

  const moderador: Participante = {
    id: novoId(),
    nome: nomeCriador,
    ehModerador: true,
    entrouEm: agora,
  };

  return {
    codigo: generateRoomCode(),
    nome: nomeSala,
    escalaPontos: input.escalaPontos,
    moderadorId: moderador.id,
    participantes: [moderador],
    criadaEm: agora,
    ultimaAtividadeEm: agora,
  };
}

/**
 * Verifica se uma sala deve ser tratada como expirada por inatividade
 * (FR-008). Necessário porque o mock persiste em localStorage, que não
 * expira sozinho (ver research.md §5).
 */
export function estaExpirada(sala: Sala, agora: number = Date.now()): boolean {
  return agora - sala.ultimaAtividadeEm > LIMITE_INATIVIDADE_MS;
}

/**
 * Adiciona um participante à sala (FR-003/FR-006). Lança RoomClientError
 * "NOME_DUPLICADO" se já existir alguém ativo com o mesmo nome
 * (case-insensitive) na sala.
 */
export function adicionarParticipante(
  sala: Sala,
  nomeBruto: string,
  agora: number = Date.now(),
): { sala: Sala; participante: Participante } {
  const nome = validarNomeParticipante(nomeBruto);

  const jaExiste = sala.participantes.some((p) => nomesIguaisCaseInsensitive(p.nome, nome));
  if (jaExiste) {
    throw new RoomClientError(
      "NOME_DUPLICADO",
      "Já existe alguém nessa sala com esse nome. Escolha outro.",
    );
  }

  const participante: Participante = {
    id: novoId(),
    nome,
    ehModerador: false,
    entrouEm: agora,
  };

  const salaAtualizada: Sala = {
    ...sala,
    participantes: [...sala.participantes, participante],
    ultimaAtividadeEm: agora,
  };

  return { sala: salaAtualizada, participante };
}

/** Remove um participante da sala (US3 — sair/desconectar). */
export function removerParticipante(
  sala: Sala,
  participanteId: string,
  agora: number = Date.now(),
): Sala {
  return {
    ...sala,
    participantes: sala.participantes.filter((p) => p.id !== participanteId),
    ultimaAtividadeEm: agora,
  };
}
