import { describe, expect, it } from "vitest";
import { adicionarParticipante, criarSala, revelar, votar } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

function novaSala() {
  return criarSala({ nomeSala: "Refinamento", nomeCriador: "Ana", escalaPontos: "fibonacci" });
}

describe("roomStore — revelar", () => {
  it("muda o estado da rodada para 'revelada' mantendo os votos já registrados", () => {
    let sala = novaSala();
    sala = votar(sala, sala.moderadorId, "5");
    sala = revelar(sala, sala.moderadorId);
    expect(sala.rodada.estado).toBe("revelada");
    expect(sala.rodada.votos[sala.moderadorId]).toBe("5");
  });

  it("revela normalmente mesmo sem nenhum voto registrado", () => {
    const sala = novaSala();
    const revelada = revelar(sala, sala.moderadorId);
    expect(revelada.rodada.estado).toBe("revelada");
    expect(revelada.rodada.votos).toEqual({});
  });

  it("rejeita com APENAS_MODERADOR quando quem chama não é o moderador", () => {
    let sala = novaSala();
    const { sala: comParticipante, participante } = adicionarParticipante(sala, "Bruno");
    sala = comParticipante;
    expect(() => revelar(sala, participante.id)).toThrowError(RoomClientError);
    try {
      revelar(sala, participante.id);
    } catch (e) {
      expect((e as RoomClientError).codigo).toBe("APENAS_MODERADOR");
    }
  });
});
