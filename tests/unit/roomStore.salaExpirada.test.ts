import { beforeEach, describe, expect, it } from "vitest";
import { mockRoomClient } from "../../src/services/mock/mockRoomClient";
import { criarSala, LIMITE_INATIVIDADE_MS } from "../../src/services/mock/roomStore";
import { Sala } from "../../src/types/room";

function salvarSalaComAtividadeAntiga(sala: Sala, msAtras: number) {
  const salaExpirada: Sala = { ...sala, ultimaAtividadeEm: Date.now() - msAtras };
  localStorage.setItem(`pokerflow:sala:${sala.codigo}`, JSON.stringify(salaExpirada));
}

describe("mockRoomClient — sala expirada por inatividade (FR-008/FR-009)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("trata uma sala inativa há mais de 4h como não encontrada", async () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    salvarSalaComAtividadeAntiga(sala, LIMITE_INATIVIDADE_MS + 1000);

    await expect(mockRoomClient.obterSala(sala.codigo)).resolves.toBeNull();
    await expect(mockRoomClient.entrarNaSala(sala.codigo, "Bruno")).rejects.toMatchObject({
      codigo: "SALA_NAO_ENCONTRADA",
    });
  });

  it("mantém uma sala ativa dentro do limite de 4h", async () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    salvarSalaComAtividadeAntiga(sala, LIMITE_INATIVIDADE_MS - 1000);

    await expect(mockRoomClient.obterSala(sala.codigo)).resolves.not.toBeNull();
  });
});
