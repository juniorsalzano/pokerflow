import { describe, expect, it } from "vitest";
import {
  addParticipant,
  createRoom,
  getRoundSummary,
  removeParticipant,
  vote,
} from "../../src/services/mock/roomStore";

describe("roomStore — getRoundSummary", () => {
  it("indica consenso quando todos os participantes atuais votam o mesmo valor", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "5");
    room = vote(room, bruno.id, "5");

    const summary = getRoundSummary(room);
    expect(summary.votedCount).toBe(2);
    expect(summary.notVoted).toEqual([]);
    expect(summary.result).toEqual({ type: "consensus", value: "5" });
  });

  it("indica dispersão (faixa min-max) para escala numérica com votos diferentes", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    const { room: withCarla, participant: carla } = addParticipant(room, "Carla");
    room = withCarla;
    room = vote(room, room.moderatorId, "5");
    room = vote(room, bruno.id, "8");
    room = vote(room, carla.id, "3");

    const summary = getRoundSummary(room);
    expect(summary.result).toEqual({ type: "spread", min: "3", max: "8" });
  });

  it("indica no-consensus para escala de camisetas (não-numérica) com votos diferentes", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "tshirts" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "P");
    room = vote(room, bruno.id, "GG");

    const summary = getRoundSummary(room);
    expect(summary.result).toEqual({ type: "no-consensus" });
  });

  it("indica no-consensus quando há mistura de valor numérico com '?' ou '☕'", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "5");
    room = vote(room, bruno.id, "☕");

    const summary = getRoundSummary(room);
    expect(summary.result).toEqual({ type: "no-consensus" });
  });

  it("lista participantes sem voto em notVoted", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "5");

    const summary = getRoundSummary(room);
    expect(summary.votedCount).toBe(1);
    expect(summary.notVoted.map((p) => p.id)).toEqual([bruno.id]);
  });

  it("não conta o voto de um participante que já saiu da sala", () => {
    let room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const { room: withBruno, participant: bruno } = addParticipant(room, "Bruno");
    room = withBruno;
    room = vote(room, room.moderatorId, "5");
    room = vote(room, bruno.id, "8");

    // Bruno sai da sala, mas seu voto órfão continua em round.votes.
    room = removeParticipant(room, bruno.id);

    const summary = getRoundSummary(room);
    expect(summary.votedCount).toBe(1);
    expect(summary.notVoted).toEqual([]);
    expect(summary.result).toEqual({ type: "consensus", value: "5" });
  });

  it("retorna no-consensus quando ninguém votou ainda", () => {
    const room = createRoom({ roomName: "S", creatorName: "Ana", pointScale: "fibonacci" });
    const summary = getRoundSummary(room);
    expect(summary.votedCount).toBe(0);
    expect(summary.result).toEqual({ type: "no-consensus" });
  });
});
