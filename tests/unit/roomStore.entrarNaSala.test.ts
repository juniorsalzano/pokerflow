import { describe, expect, it } from "vitest";
import { adicionarParticipante, criarSala } from "../../src/services/mock/roomStore";

describe("roomStore — adicionarParticipante (entrar na sala)", () => {
  it("adiciona um participante com nome disponível", () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: atualizada, participante } = adicionarParticipante(sala, "Bruno");

    expect(atualizada.participantes).toHaveLength(2);
    expect(participante.nome).toBe("Bruno");
    expect(participante.ehModerador).toBe(false);
  });
});
