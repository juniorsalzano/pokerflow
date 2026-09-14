import { describe, expect, it } from "vitest";
import { criarSala } from "../../src/services/mock/roomStore";

describe("roomStore — criarSala", () => {
  it("cria uma sala com código único, nome, escala e moderador", () => {
    const sala = criarSala({
      nomeSala: "Refinamento Sprint 42",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });

    expect(sala.codigo).toBeTruthy();
    expect(sala.codigo.length).toBeGreaterThanOrEqual(6);
    expect(sala.nome).toBe("Refinamento Sprint 42");
    expect(sala.escalaPontos).toBe("fibonacci");
    expect(sala.participantes).toHaveLength(1);
    expect(sala.participantes[0].nome).toBe("Ana");
    expect(sala.participantes[0].ehModerador).toBe(true);
    expect(sala.moderadorId).toBe(sala.participantes[0].id);
  });

  it("gera códigos diferentes para salas diferentes", () => {
    const salaA = criarSala({ nomeSala: "A", nomeCriador: "X", escalaPontos: "sequencial" });
    const salaB = criarSala({ nomeSala: "B", nomeCriador: "Y", escalaPontos: "sequencial" });
    expect(salaA.codigo).not.toBe(salaB.codigo);
  });
});
