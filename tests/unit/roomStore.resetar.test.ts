import { describe, expect, it } from "vitest";
import { adicionarParticipante, criarSala, resetar, revelar, votar } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

function novaSala() {
  return criarSala({ nomeSala: "Refinamento", nomeCriador: "Ana", escalaPontos: "fibonacci" });
}

describe("roomStore — resetar", () => {
  it("limpa os votos e volta ao estado 'votando' depois de revelada (FR-011)", () => {
    let sala = novaSala();
    sala = votar(sala, sala.moderadorId, "5");
    sala = revelar(sala, sala.moderadorId);
    sala = resetar(sala, sala.moderadorId);
    expect(sala.rodada.estado).toBe("votando");
    expect(sala.rodada.votos).toEqual({});
  });

  it("é aceito mesmo antes de revelar, limpando votos parciais (FR-012)", () => {
    let sala = novaSala();
    sala = votar(sala, sala.moderadorId, "5");
    sala = resetar(sala, sala.moderadorId);
    expect(sala.rodada.estado).toBe("votando");
    expect(sala.rodada.votos).toEqual({});
  });

  it("rejeita com APENAS_MODERADOR quando quem chama não é o moderador", () => {
    let sala = novaSala();
    const { sala: comParticipante, participante } = adicionarParticipante(sala, "Bruno");
    sala = comParticipante;
    expect(() => resetar(sala, participante.id)).toThrowError(RoomClientError);
    try {
      resetar(sala, participante.id);
    } catch (e) {
      expect((e as RoomClientError).codigo).toBe("APENAS_MODERADOR");
    }
  });
});
