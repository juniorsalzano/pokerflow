import { describe, expect, it } from "vitest";
import { addParticipant, createRoom, removeParticipant } from "../../src/services/mock/roomStore";

describe("roomStore — removeParticipant (sair da sala)", () => {
  it("remove o participante da lista", () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");

    const withoutBruno = removeParticipant(withBruno, bruno.id);

    expect(withoutBruno.participants).toHaveLength(1);
    expect(withoutBruno.participants.find((p) => p.id === bruno.id)).toBeUndefined();
  });

  it("não afeta os demais participantes", () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");

    const withoutBruno = removeParticipant(withBruno, bruno.id);

    expect(withoutBruno.participants[0].name).toBe("Ana");
  });
});
