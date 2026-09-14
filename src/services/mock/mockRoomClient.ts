import { RoomClient } from "../roomClient";
import { CriarSalaInput, RoomClientError, Sala } from "../../types/room";
import {
  adicionarParticipante,
  criarSala as criarSalaPura,
  estaExpirada,
  removerParticipante,
  resetar as resetarPura,
  revelar as revelarPura,
  votar as votarPura,
} from "./roomStore";

/**
 * Implementação mockada de RoomClient: localStorage como fonte da verdade
 * entre abas + BroadcastChannel para notificar quase instantaneamente as
 * abas já abertas (research.md §1). Quando a API real existir, uma
 * implementação http/httpRoomClient.ts assume este mesmo contrato.
 */

function storageKey(codigo: string): string {
  return `pokerflow:sala:${codigo}`;
}

function lerSalaBruta(codigo: string): Sala | null {
  const bruto = localStorage.getItem(storageKey(codigo));
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Sala;
  } catch {
    return null;
  }
}

function salvarSala(sala: Sala): void {
  localStorage.setItem(storageKey(sala.codigo), JSON.stringify(sala));
  notificarLocal(sala.codigo, sala);
  obterCanal(sala.codigo).postMessage({ tipo: "mudou" });
}

function apagarSala(codigo: string): void {
  localStorage.removeItem(storageKey(codigo));
  notificarLocal(codigo, null);
}

// Registro de assinantes locais (dentro desta mesma aba) por código de sala.
const assinantesPorCodigo = new Map<string, Set<(sala: Sala | null) => void>>();
const canaisPorCodigo = new Map<string, BroadcastChannel>();

function notificarLocal(codigo: string, sala: Sala | null): void {
  assinantesPorCodigo.get(codigo)?.forEach((cb) => cb(sala));
}

/** Stub sem-op para ambientes sem BroadcastChannel (ex.: alguns runtimes de teste). */
const canalNulo = { postMessage: () => {}, close: () => {}, onmessage: null } as unknown as BroadcastChannel;

function obterCanal(codigo: string): BroadcastChannel {
  let canal = canaisPorCodigo.get(codigo);
  if (!canal) {
    if (typeof BroadcastChannel === "undefined") {
      canal = canalNulo;
    } else {
      canal = new BroadcastChannel(storageKey(codigo));
      canal.onmessage = () => {
        notificarLocal(codigo, lerSalaAtual(codigo));
      };
    }
    canaisPorCodigo.set(codigo, canal);
  }
  return canal;
}

/** Lê a sala do localStorage, tratando expiração por inatividade (FR-008). */
function lerSalaAtual(codigo: string): Sala | null {
  const sala = lerSalaBruta(codigo);
  if (!sala) return null;
  if (estaExpirada(sala)) {
    apagarSala(codigo);
    return null;
  }
  return sala;
}

export const mockRoomClient: RoomClient = {
  async criarSala(input: CriarSalaInput) {
    const sala = criarSalaPura(input);
    salvarSala(sala);
    return { codigo: sala.codigo, sala };
  },

  async entrarNaSala(codigo: string, nomeParticipante: string) {
    const sala = lerSalaAtual(codigo);
    if (!sala) {
      throw new RoomClientError("SALA_NAO_ENCONTRADA", "Essa sala não existe ou expirou.");
    }
    const { sala: salaAtualizada, participante } = adicionarParticipante(sala, nomeParticipante);
    salvarSala(salaAtualizada);
    return { participanteId: participante.id, sala: salaAtualizada };
  },

  async obterSala(codigo: string) {
    return lerSalaAtual(codigo);
  },

  assinarSala(codigo: string, callback: (sala: Sala | null) => void) {
    if (!assinantesPorCodigo.has(codigo)) {
      assinantesPorCodigo.set(codigo, new Set());
    }
    const assinantes = assinantesPorCodigo.get(codigo)!;
    assinantes.add(callback);
    obterCanal(codigo); // garante que o canal exista enquanto houver assinantes

    // Notifica o estado atual imediatamente, para o assinante não esperar a
    // próxima mudança para ter os dados iniciais.
    callback(lerSalaAtual(codigo));

    const handleStorage = (evento: StorageEvent) => {
      if (evento.key === storageKey(codigo)) {
        callback(lerSalaAtual(codigo));
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      assinantes.delete(callback);
      window.removeEventListener("storage", handleStorage);
      if (assinantes.size === 0) {
        canaisPorCodigo.get(codigo)?.close();
        canaisPorCodigo.delete(codigo);
        assinantesPorCodigo.delete(codigo);
      }
    };
  },

  async sairDaSala(codigo: string, participanteId: string) {
    const sala = lerSalaAtual(codigo);
    if (!sala) return; // já não existe — nada a fazer, operação idempotente
    const salaAtualizada = removerParticipante(sala, participanteId);
    salvarSala(salaAtualizada);
  },

  async votar(codigo: string, participanteId: string, valor: string) {
    const sala = lerSalaAtual(codigo);
    if (!sala) {
      throw new RoomClientError("SALA_NAO_ENCONTRADA", "Essa sala não existe ou expirou.");
    }
    const salaAtualizada = votarPura(sala, participanteId, valor);
    salvarSala(salaAtualizada);
    return salaAtualizada;
  },

  async revelar(codigo: string, participanteId: string) {
    const sala = lerSalaAtual(codigo);
    if (!sala) {
      throw new RoomClientError("SALA_NAO_ENCONTRADA", "Essa sala não existe ou expirou.");
    }
    const salaAtualizada = revelarPura(sala, participanteId);
    salvarSala(salaAtualizada);
    return salaAtualizada;
  },

  async resetar(codigo: string, participanteId: string) {
    const sala = lerSalaAtual(codigo);
    if (!sala) {
      throw new RoomClientError("SALA_NAO_ENCONTRADA", "Essa sala não existe ou expirou.");
    }
    const salaAtualizada = resetarPura(sala, participanteId);
    salvarSala(salaAtualizada);
    return salaAtualizada;
  },
};
