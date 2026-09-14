import { generateRoomCode } from "./generateRoomCode";
import { nomesIguaisCaseInsensitive, validarNomeParticipante, validarNomeSala } from "./validation";
import {
  CriarSalaInput,
  ESCALAS_PONTOS,
  Participante,
  ResumoRodada,
  RoomClientError,
  Sala,
} from "../../types/room";

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
    rodada: { estado: "votando", votos: {} },
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

/**
 * Registra ou substitui o voto de um participante na rodada atual
 * (FR-002/FR-005). Lança `RODADA_JA_REVELADA` se a rodada já foi revelada
 * (FR-009 — votos travados após o reveal) e `VALOR_INVALIDO` se o valor não
 * pertencer à escala de pontos da sala.
 */
export function votar(
  sala: Sala,
  participanteId: string,
  valor: string,
  agora: number = Date.now(),
): Sala {
  if (sala.rodada.estado !== "votando") {
    throw new RoomClientError(
      "RODADA_JA_REVELADA",
      "Os votos desta rodada já foram revelados. Aguarde o próximo reset para votar.",
    );
  }
  if (!ESCALAS_PONTOS[sala.escalaPontos].includes(valor)) {
    throw new RoomClientError("VALOR_INVALIDO", "Esse valor não faz parte da escala desta sala.");
  }

  return {
    ...sala,
    rodada: {
      ...sala.rodada,
      votos: { ...sala.rodada.votos, [participanteId]: valor },
    },
    ultimaAtividadeEm: agora,
  };
}

/**
 * Revela os votos da rodada atual (FR-006/FR-007), exclusivo ao moderador.
 * Lança `APENAS_MODERADOR` se quem chamou não for o dono da sala.
 */
export function revelar(sala: Sala, participanteId: string, agora: number = Date.now()): Sala {
  if (participanteId !== sala.moderadorId) {
    throw new RoomClientError("APENAS_MODERADOR", "Apenas o moderador da sala pode revelar os votos.");
  }

  return {
    ...sala,
    rodada: { ...sala.rodada, estado: "revelada" },
    ultimaAtividadeEm: agora,
  };
}

/**
 * Limpa os votos da rodada atual e volta ao estado de votação oculta
 * (FR-010/FR-011/FR-012), exclusivo ao moderador. Aceito em qualquer estado
 * atual da rodada (idempotente em relação a `estado`).
 */
export function resetar(sala: Sala, participanteId: string, agora: number = Date.now()): Sala {
  if (participanteId !== sala.moderadorId) {
    throw new RoomClientError("APENAS_MODERADOR", "Apenas o moderador da sala pode resetar a rodada.");
  }

  return {
    ...sala,
    rodada: { estado: "votando", votos: {} },
    ultimaAtividadeEm: agora,
  };
}

/** Verdadeiro se `valor` for um valor numérico da escala (exclui "?" e "☕"). */
function ehValorNumerico(valor: string): boolean {
  return valor.trim() !== "" && !Number.isNaN(Number(valor));
}

/**
 * Resumo derivado da rodada atual (data-model.md §Resumo pós-revelação),
 * calculado sob demanda — nunca persistido. Itera sobre `sala.participantes`
 * (a lista atual), nunca sobre `Object.keys(rodada.votos)` diretamente: o
 * voto de alguém que já saiu da sala não deve mais contar em nenhum
 * resultado (Caso de Borda da spec).
 */
export function resumoRodada(sala: Sala): ResumoRodada {
  const { votos } = sala.rodada;

  const naoVotaram = sala.participantes.filter((p) => !(p.id in votos));
  const votosAtuais = sala.participantes.filter((p) => p.id in votos).map((p) => votos[p.id]);
  const votaram = votosAtuais.length;

  if (votaram === 0) {
    return { votaram, naoVotaram, resultado: { tipo: "sem-consenso" } };
  }

  const todosIdenticos = votosAtuais.every((v) => v === votosAtuais[0]);
  if (todosIdenticos) {
    return { votaram, naoVotaram, resultado: { tipo: "consenso", valor: votosAtuais[0] } };
  }

  const escalaNumerica = sala.escalaPontos === "fibonacci" || sala.escalaPontos === "sequencial";
  if (escalaNumerica && votosAtuais.every(ehValorNumerico)) {
    const ordenados = [...votosAtuais].sort((a, b) => Number(a) - Number(b));
    return {
      votaram,
      naoVotaram,
      resultado: { tipo: "dispersao", min: ordenados[0], max: ordenados[ordenados.length - 1] },
    };
  }

  return { votaram, naoVotaram, resultado: { tipo: "sem-consenso" } };
}
