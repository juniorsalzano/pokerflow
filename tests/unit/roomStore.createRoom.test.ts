import { describe, expect, it } from "vitest";
import { createRoom } from "../../src/services/mock/roomStore";

describe("roomStore — createRoom", () => {
  it("cria uma sala com código único, nome, escala e moderador", () => {
    const room = createRoom({
      roomName: "Refinamento Sprint 42",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });

    expect(room.code).toBeTruthy();
    expect(room.code.length).toBeGreaterThanOrEqual(6);
    expect(room.name).toBe("Refinamento Sprint 42");
    expect(room.pointScale).toBe("fibonacci");
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].name).toBe("Ana");
    expect(room.participants[0].isModerator).toBe(true);
    expect(room.moderatorId).toBe(room.participants[0].id);
  });

  it("gera códigos diferentes para salas diferentes", () => {
    const roomA = createRoom({ roomName: "A", creatorName: "X", pointScale: "sequential" });
    const roomB = createRoom({ roomName: "B", creatorName: "Y", pointScale: "sequential" });
    expect(roomA.code).not.toBe(roomB.code);
  });
});
