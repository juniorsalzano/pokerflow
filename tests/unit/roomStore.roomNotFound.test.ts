import { beforeEach, describe, expect, it } from "vitest";
import { mockRoomClient } from "../../src/services/mock/mockRoomClient";
import { RoomClientError } from "../../src/types/room";

describe("mockRoomClient — sala inexistente (FR-009)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getRoom retorna null para um código que nunca existiu", async () => {
    await expect(mockRoomClient.getRoom("naoexiste")).resolves.toBeNull();
  });

  it("joinRoom lança ROOM_NOT_FOUND para código inexistente", async () => {
    await expect(mockRoomClient.joinRoom("naoexiste", "Ana")).rejects.toMatchObject({
      code: "ROOM_NOT_FOUND",
    } satisfies Partial<RoomClientError>);
  });
});
