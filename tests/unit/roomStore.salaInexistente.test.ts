import { beforeEach, describe, expect, it } from "vitest";
import { mockRoomClient } from "../../src/services/mock/mockRoomClient";
import { RoomClientError } from "../../src/types/room";

describe("mockRoomClient — sala inexistente (FR-009)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("obterSala retorna null para um código que nunca existiu", async () => {
    await expect(mockRoomClient.obterSala("naoexiste")).resolves.toBeNull();
  });

  it("entrarNaSala lança SALA_NAO_ENCONTRADA para código inexistente", async () => {
    await expect(mockRoomClient.entrarNaSala("naoexiste", "Ana")).rejects.toMatchObject({
      codigo: "SALA_NAO_ENCONTRADA",
    } satisfies Partial<RoomClientError>);
  });
});
