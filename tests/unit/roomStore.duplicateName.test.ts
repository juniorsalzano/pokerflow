import { describe, expect, it } from "vitest";
import { addParticipant, createRoom } from "../../src/services/mock/roomStore";
import { RoomClientError } from "../../src/types/room";

describe("roomStore — nome duplicado (FR-006)", () => {
  it("rejeita um nome já em uso na mesma sala, comparando case-insensitive", () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });

    expect(() => addParticipant(room, "ana")).toThrow(RoomClientError);
    expect(() => addParticipant(room, "ANA")).toThrow(RoomClientError);
  });

  it("permite nomes diferentes normalmente", () => {
    const room = createRoom({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" });
    expect(() => addParticipant(room, "Bruno")).not.toThrow();
  });
});
