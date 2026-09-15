import { beforeEach, describe, expect, it } from "vitest";
import { mockRoomClient } from "../../src/services/mock/mockRoomClient";

describe("mockRoomClient — salas simultâneas são independentes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("duas salas criadas ao mesmo tempo recebem códigos diferentes", async () => {
    const { code: codeA } = await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "sequential",
    });

    expect(codeA).not.toBe(codeB);
  });

  it("participante que entra na sala A não aparece na sala B", async () => {
    const { code: codeA } = await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "sequential",
    });

    await mockRoomClient.joinRoom(codeA, "Carla");

    const roomA = await mockRoomClient.getRoom(codeA);
    const roomB = await mockRoomClient.getRoom(codeB);

    expect(roomA?.participants.map((p) => p.name)).toEqual(["Ana", "Carla"]);
    expect(roomB?.participants.map((p) => p.name)).toEqual(["Bruno"]);
  });

  it("o mesmo nome pode ser usado em duas salas diferentes (unicidade é só dentro da sala)", async () => {
    await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "sequential",
    });

    await expect(mockRoomClient.joinRoom(codeB, "Ana")).resolves.toBeDefined();

    const roomB = await mockRoomClient.getRoom(codeB);
    expect(roomB?.participants.map((p) => p.name)).toEqual(["Bruno", "Ana"]);
  });

  it("assinar a sala A não é notificado por mudanças na sala B", async () => {
    const { code: codeA } = await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "sequential",
    });

    const calls: Array<string[] | null> = [];
    const unsubscribe = mockRoomClient.subscribeToRoom(codeA, (room) => {
      calls.push(room?.participants.map((p) => p.name) ?? null);
    });

    await mockRoomClient.joinRoom(codeB, "Carla");

    // Só a notificação inicial (estado atual de A no momento da assinatura).
    expect(calls).toEqual([["Ana"]]);

    unsubscribe();
  });

  it("saída de um participante na sala A não afeta a sala B", async () => {
    const { code: codeA, room: roomA } = await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "sequential",
    });

    await mockRoomClient.leaveRoom(codeA, roomA.participants[0].id);

    const updatedRoomA = await mockRoomClient.getRoom(codeA);
    const roomB = await mockRoomClient.getRoom(codeB);

    expect(updatedRoomA?.participants).toHaveLength(0);
    expect(roomB?.participants.map((p) => p.name)).toEqual(["Bruno"]);
  });

  it("votar na sala A não afeta a rodada da sala B", async () => {
    const { code: codeA, room: roomA } = await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB, room: roomB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "fibonacci",
    });

    await mockRoomClient.vote(codeA, roomA.participants[0].id, "5");

    const updatedRoomA = await mockRoomClient.getRoom(codeA);
    const updatedRoomB = await mockRoomClient.getRoom(codeB);

    expect(updatedRoomA?.round.votes).toEqual({ [roomA.participants[0].id]: "5" });
    expect(updatedRoomB?.round.votes).toEqual({});
    expect(roomB).toBeDefined();
  });

  it("revelar a rodada da sala A não afeta o estado da rodada da sala B", async () => {
    const { code: codeA, room: roomA } = await mockRoomClient.createRoom({
      roomName: "Sala A",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });
    const { code: codeB } = await mockRoomClient.createRoom({
      roomName: "Sala B",
      creatorName: "Bruno",
      pointScale: "fibonacci",
    });

    await mockRoomClient.reveal(codeA, roomA.participants[0].id);

    const updatedRoomA = await mockRoomClient.getRoom(codeA);
    const updatedRoomB = await mockRoomClient.getRoom(codeB);

    expect(updatedRoomA?.round.state).toBe("revealed");
    expect(updatedRoomB?.round.state).toBe("voting");
  });
});
