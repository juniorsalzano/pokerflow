import { describe, expect, it } from "vitest";
import { createRoom, reveal, vote } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

function newRoom() {
  return createRoom({ roomName: "Refinamento", creatorName: "Ana", pointScale: "fibonacci" });
}

describe("roomStore — vote", () => {
  it("registra o voto do participante na rodada atual", () => {
    const room = newRoom();
    const updated = vote(room, room.moderatorId, "5");
    expect(updated.round.votes[room.moderatorId]).toBe("5");
    expect(updated.round.state).toBe("voting");
  });

  it("permite trocar o voto quantas vezes quiser antes de revelar (FR-005)", () => {
    let room = newRoom();
    room = vote(room, room.moderatorId, "3");
    room = vote(room, room.moderatorId, "8");
    expect(room.round.votes[room.moderatorId]).toBe("8");
  });

  it("rejeita valor fora da escala da sala com INVALID_VALUE", () => {
    const room = newRoom();
    expect(() => vote(room, room.moderatorId, "100")).toThrowError(RoomClientError);
    try {
      vote(room, room.moderatorId, "100");
    } catch (e) {
      expect(e).toBeInstanceOf(RoomClientError);
      expect((e as RoomClientError).code).toBe("INVALID_VALUE");
    }
  });

  it("rejeita voto depois que a rodada foi revelada (ROUND_ALREADY_REVEALED)", () => {
    let room = newRoom();
    room = vote(room, room.moderatorId, "5");
    room = reveal(room, room.moderatorId);
    expect(() => vote(room, room.moderatorId, "8")).toThrowError(RoomClientError);
    try {
      vote(room, room.moderatorId, "8");
    } catch (e) {
      expect((e as RoomClientError).code).toBe("ROUND_ALREADY_REVEALED");
    }
  });

  it("não altera o voto de outros participantes ao votar", () => {
    let room = newRoom();
    room = vote(room, room.moderatorId, "5");
    const otherId = "outro-participante";
    room = vote(room, otherId, "8");
    expect(room.round.votes[room.moderatorId]).toBe("5");
    expect(room.round.votes[otherId]).toBe("8");
  });
});
