import { beforeEach, describe, expect, it } from "vitest";
import { mockRoomClient } from "../../src/services/mock/mockRoomClient";
import { createRoom, INACTIVITY_LIMIT_MS } from "../../src/services/mock/roomStore";
import { Room } from "../../src/types/room";

function saveRoomWithOldActivity(room: Room, msAgo: number) {
  const expiredRoom: Room = { ...room, lastActivityAt: Date.now() - msAgo };
  localStorage.setItem(`pokerflow:room:${room.code}`, JSON.stringify(expiredRoom));
}

describe("mockRoomClient — sala expirada por inatividade (FR-008/FR-009)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("trata uma sala inativa há mais de 4h como não encontrada", async () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });
    saveRoomWithOldActivity(room, INACTIVITY_LIMIT_MS + 1000);

    await expect(mockRoomClient.getRoom(room.code)).resolves.toBeNull();
    await expect(mockRoomClient.joinRoom(room.code, "Bruno")).rejects.toMatchObject({
      code: "ROOM_NOT_FOUND",
    });
  });

  it("mantém uma sala ativa dentro do limite de 4h", async () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });
    saveRoomWithOldActivity(room, INACTIVITY_LIMIT_MS - 1000);

    await expect(mockRoomClient.getRoom(room.code)).resolves.not.toBeNull();
  });
});
