import { describe, expect, it } from "vitest";
import {
  addParticipant,
  createRoom,
  groupByValue,
  removeParticipant,
  vote,
} from "../../src/services/mock/roomStore";

describe("roomStore — groupByValue (spec 004, FR-007/FR-011/FR-012)", () => {
  it("agrupa participantes por valor distinto votado", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    const { room: withCarla, participant: carla } = addParticipant(room, "Carla");
    room = withCarla;
    room = vote(room, room.moderatorId, "5");
    room = vote(room, bruno.id, "5");
    room = vote(room, carla.id, "8");

    const distribution = groupByValue(room);

    expect(distribution.groups).toHaveLength(2);
    const groupFive = distribution.groups.find((g) => g.value === "5");
    const groupEight = distribution.groups.find((g) => g.value === "8");
    expect(groupFive?.participants.map((p) => p.id).sort()).toEqual(
      [room.moderatorId, bruno.id].sort(),
    );
    expect(groupEight?.participants.map((p) => p.id)).toEqual([carla.id]);
    expect(distribution.notVoted).toEqual([]);
  });

  it("agrupa corretamente para escalas não numéricas (camisetas)", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "tshirts" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "M");
    room = vote(room, bruno.id, "GG");

    const distribution = groupByValue(room);
    expect(distribution.groups.map((g) => g.value).sort()).toEqual(["GG", "M"]);
  });

  it("todos os votos iguais produzem um único grupo com todo mundo dentro", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "3");
    room = vote(room, bruno.id, "3");

    const distribution = groupByValue(room);
    expect(distribution.groups).toHaveLength(1);
    expect(distribution.groups[0].participants).toHaveLength(2);
  });

  it("participantes que não votaram ficam em notVoted e não aparecem em nenhum grupo", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "5");

    const distribution = groupByValue(room);
    expect(distribution.groups).toEqual([{ value: "5", participants: [room.participants[0]] }]);
    expect(distribution.notVoted.map((p) => p.id)).toEqual([bruno.id]);
  });

  it("retorna grupos vazios quando ninguém votou", () => {
    const room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const distribution = groupByValue(room);
    expect(distribution.groups).toEqual([]);
    expect(distribution.notVoted.map((p) => p.id)).toEqual([room.moderatorId]);
  });

  it("não conta o voto de um participante que já saiu da sala", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "5");
    room = vote(room, bruno.id, "8");
    room = removeParticipant(room, bruno.id);

    const distribution = groupByValue(room);
    expect(distribution.groups).toEqual([{ value: "5", participants: [room.participants[0]] }]);
  });
});
