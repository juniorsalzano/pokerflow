import { describe, expect, it } from "vitest";
import { criarSala, revelar, votar } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

function novaSala() {
  return criarSala({ nomeSala: "Refinamento", nomeCriador: "Ana", escalaPontos: "fibonacci" });
}

describe("roomStore — votar", () => {
  it("registra o voto do participante na rodada atual", () => {
    const sala = novaSala();
    const atualizada = votar(sala, sala.moderadorId, "5");
    expect(atualizada.rodada.votos[sala.moderadorId]).toBe("5");
    expect(atualizada.rodada.estado).toBe("votando");
  });

  it("permite trocar o voto quantas vezes quiser antes de revelar (FR-005)", () => {
    let sala = novaSala();
    sala = votar(sala, sala.moderadorId, "3");
    sala = votar(sala, sala.moderadorId, "8");
    expect(sala.rodada.votos[sala.moderadorId]).toBe("8");
  });

  it("rejeita valor fora da escala da sala com VALOR_INVALIDO", () => {
    const sala = novaSala();
    expect(() => votar(sala, sala.moderadorId, "100")).toThrowError(RoomClientError);
    try {
      votar(sala, sala.moderadorId, "100");
    } catch (e) {
      expect(e).toBeInstanceOf(RoomClientError);
      expect((e as RoomClientError).codigo).toBe("VALOR_INVALIDO");
    }
  });

  it("rejeita voto depois que a rodada foi revelada (RODADA_JA_REVELADA)", () => {
    let sala = novaSala();
    sala = votar(sala, sala.moderadorId, "5");
    sala = revelar(sala, sala.moderadorId);
    expect(() => votar(sala, sala.moderadorId, "8")).toThrowError(RoomClientError);
    try {
      votar(sala, sala.moderadorId, "8");
    } catch (e) {
      expect((e as RoomClientError).codigo).toBe("RODADA_JA_REVELADA");
    }
  });

  it("não altera o voto de outros participantes ao votar", () => {
    let sala = novaSala();
    sala = votar(sala, sala.moderadorId, "5");
    const outroId = "outro-participante";
    sala = votar(sala, outroId, "8");
    expect(sala.rodada.votos[sala.moderadorId]).toBe("5");
    expect(sala.rodada.votos[outroId]).toBe("8");
  });
});
