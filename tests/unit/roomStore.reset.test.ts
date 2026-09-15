import { describe, expect, it } from "vitest";
import { addParticipant, createRoom, reset, reveal, vote } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

function newRoom() {
  return createRoom({ roomName: "Refinamento", creatorName: "Ana", pointScale: "fibonacci" });
}

describe("roomStore — reset", () => {
  it("limpa os votos e volta ao estado 'voting' depois de revelada (FR-011)", () => {
    let room = newRoom();
    room = vote(room, room.moderatorId, "5");
    room = reveal(room, room.moderatorId);
    room = reset(room, room.moderatorId);
    expect(room.round.state).toBe("voting");
    expect(room.round.votes).toEqual({});
  });

  it("é aceito mesmo antes de revelar, limpando votos parciais (FR-012)", () => {
    let room = newRoom();
    room = vote(room, room.moderatorId, "5");
    room = reset(room, room.moderatorId);
    expect(room.round.state).toBe("voting");
    expect(room.round.votes).toEqual({});
  });

  it("rejeita com MODERATOR_ONLY quando quem chama não é o moderador", () => {
    let room = newRoom();
    const { room: withParticipant, participant } = addParticipant(room, "Bruno");
    room = withParticipant;
    expect(() => reset(room, participant.id)).toThrowError(RoomClientError);
    try {
      reset(room, participant.id);
    } catch (e) {
      expect((e as RoomClientError).code).toBe("MODERATOR_ONLY");
    }
  });
});
