import { describe, expect, it } from "vitest";
import { addParticipant, createRoom, reveal, vote } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

function newRoom() {
  return createRoom({ roomName: "Refinamento", creatorName: "Ana", pointScale: "fibonacci" });
}

describe("roomStore — reveal", () => {
  it("muda o estado da rodada para 'revealed' mantendo os votos já registrados", () => {
    let room = newRoom();
    room = vote(room, room.moderatorId, "5");
    room = reveal(room, room.moderatorId);
    expect(room.round.state).toBe("revealed");
    expect(room.round.votes[room.moderatorId]).toBe("5");
  });

  it("revela normalmente mesmo sem nenhum voto registrado", () => {
    const room = newRoom();
    const revealed = reveal(room, room.moderatorId);
    expect(revealed.round.state).toBe("revealed");
    expect(revealed.round.votes).toEqual({});
  });

  it("rejeita com MODERATOR_ONLY quando quem chama não é o moderador", () => {
    let room = newRoom();
    const { room: withParticipant, participant } = addParticipant(room, "Bruno");
    room = withParticipant;
    expect(() => reveal(room, participant.id)).toThrowError(RoomClientError);
    try {
      reveal(room, participant.id);
    } catch (e) {
      expect((e as RoomClientError).code).toBe("MODERATOR_ONLY");
    }
  });
});
