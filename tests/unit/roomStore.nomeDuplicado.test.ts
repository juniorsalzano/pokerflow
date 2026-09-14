import { describe, expect, it } from "vitest";
import { adicionarParticipante, criarSala } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

describe("roomStore — nome duplicado (FR-006)", () => {
  it("rejeita um nome já em uso na mesma sala, comparando case-insensitive", () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });

    expect(() => adicionarParticipante(sala, "ana")).toThrow(RoomClientError);
    expect(() => adicionarParticipante(sala, "ANA")).toThrow(RoomClientError);
  });

  it("permite nomes diferentes normalmente", () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    expect(() => adicionarParticipante(sala, "Bruno")).not.toThrow();
  });
});
