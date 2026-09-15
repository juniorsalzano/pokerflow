import { describe, expect, it } from "vitest";
import { addParticipant, createRoom } from "../../src/services/mock/roomStore";

describe("roomStore — addParticipant (entrar na sala)", () => {
  it("adiciona um participante com nome disponível", () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: updatedRoom, participant } = addParticipant(room, "Bruno");

    expect(updatedRoom.participants).toHaveLength(2);
    expect(participant.name).toBe("Bruno");
    expect(participant.isModerator).toBe(false);
  });
});
