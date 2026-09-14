import { describe, expect, it } from "vitest";
import { criarSala, removerParticipante } from "../../src/services/mock/roomStore";
import { adicionarParticipante } from "../../src/services/mock/roomStore";

describe("roomStore — removerParticipante (sair da sala)", () => {
  it("remove o participante da lista", () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");

    const semBruno = removerParticipante(comBruno, bruno.id);

    expect(semBruno.participantes).toHaveLength(1);
    expect(semBruno.participantes.find((p) => p.id === bruno.id)).toBeUndefined();
  });

  it("não afeta os demais participantes", () => {
    const sala = criarSala({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");

    const semBruno = removerParticipante(comBruno, bruno.id);

    expect(semBruno.participantes[0].nome).toBe("Ana");
  });
});
