import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpRoomClient } from "../../src/services/http/httpRoomClient";
import { saveIdentity } from "../../src/hooks/useModerator";
import { RoomClientError } from "../../src/types/room";

const BASE_URL = "http://localhost:3000/planning-poker";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("httpRoomClient — montagem de requisições", () => {
  it("createRoom faz POST /rooms com o corpo certo e devolve token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, {
        code: "abc1234",
        participantId: "p1",
        token: "token-secreto",
        room: {
          code: "abc1234",
          name: "Sala",
          pointScale: "fibonacci",
          moderatorId: "p1",
          participants: [{ id: "p1", name: "Ana", isModerator: true, joinedAt: 1 }],
          createdAt: 1,
          lastActivityAt: 1,
          round: { state: "voting", voters: [] },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await httpRoomClient.createRoom({
      roomName: "Sala",
      creatorName: "Ana",
      pointScale: "fibonacci",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roomName: "Sala", creatorName: "Ana", pointScale: "fibonacci" }),
      }),
    );
    expect(result.token).toBe("token-secreto");
    expect(result.code).toBe("abc1234");
  });

  it("vote envia participantId, token e value no corpo", async () => {
    saveIdentity("abc1234", { participantId: "p1", isModerator: true, token: "token-secreto" });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: "abc1234",
        name: "Sala",
        pointScale: "fibonacci",
        moderatorId: "p1",
        participants: [{ id: "p1", name: "Ana", isModerator: true, joinedAt: 1 }],
        createdAt: 1,
        lastActivityAt: 1,
        round: { state: "voting", voters: ["p1"], myVote: "5" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await httpRoomClient.vote("abc1234", "p1", "5");

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms/abc1234/votes`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", token: "token-secreto", value: "5" }),
      }),
    );
  });

  it("sendHeartbeat faz POST /heartbeat com participantId e token, sem tratar a resposta como Room", async () => {
    saveIdentity("abc1234", { participantId: "p1", isModerator: true, token: "token-secreto" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await httpRoomClient.sendHeartbeat("abc1234", "p1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms/abc1234/heartbeat`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", token: "token-secreto" }),
      }),
    );
  });

  it("uma falha de sendHeartbeat (rede ou 401) propaga como erro comum, sem quebrar reconstrução de Room", async () => {
    saveIdentity("abc1234", { participantId: "p1", isModerator: true, token: "token-secreto" });
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network error"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(httpRoomClient.sendHeartbeat("abc1234", "p1")).rejects.not.toBeInstanceOf(RoomClientError);
  });

  it("getRoom manda participantId e token na query quando a identidade existe", async () => {
    saveIdentity("abc1234", { participantId: "p1", isModerator: true, token: "token-secreto" });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: "abc1234",
        name: "Sala",
        pointScale: "fibonacci",
        moderatorId: "p1",
        participants: [{ id: "p1", name: "Ana", isModerator: true, joinedAt: 1 }],
        createdAt: 1,
        lastActivityAt: 1,
        round: { state: "voting", voters: [] },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await httpRoomClient.getRoom("abc1234");

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms/abc1234?participantId=p1&token=token-secreto`,
      expect.anything(),
    );
  });
});

describe("httpRoomClient — reconstrução de votos a partir do payload redigido", () => {
  it("usa o valor real só para o próprio voto; placeholder não-vazio para os demais, antes do reveal", async () => {
    saveIdentity("abc1234", { participantId: "eu", isModerator: false, token: "meu-token" });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: "abc1234",
        name: "Sala",
        pointScale: "fibonacci",
        moderatorId: "outro",
        participants: [
          { id: "eu", name: "Eu", isModerator: false, joinedAt: 1 },
          { id: "outro", name: "Outro", isModerator: true, joinedAt: 1 },
        ],
        createdAt: 1,
        lastActivityAt: 1,
        round: { state: "voting", voters: ["eu", "outro"], myVote: "5" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const room = await httpRoomClient.getRoom("abc1234");

    expect(room?.round.votes["eu"]).toBe("5");
    // O servidor nunca incluiu o valor real de "outro" no payload (mock acima só
    // tem myVote) — o placeholder é só pra manter "já votou" visível no SeatCard.
    expect(room?.round.votes["outro"]).toBeDefined();
    expect(room?.round.votes["outro"]).not.toBe("5");
  });

  it("usa o mapa completo de votos quando a rodada foi revelada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: "abc1234",
        name: "Sala",
        pointScale: "fibonacci",
        moderatorId: "p1",
        participants: [
          { id: "p1", name: "Ana", isModerator: true, joinedAt: 1 },
          { id: "p2", name: "Bia", isModerator: false, joinedAt: 1 },
        ],
        createdAt: 1,
        lastActivityAt: 1,
        round: { state: "revealed", voters: ["p1", "p2"], votes: { p1: "5", p2: "8" } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const room = await httpRoomClient.getRoom("abc1234");

    expect(room?.round.votes).toEqual({ p1: "5", p2: "8" });
  });
});

describe("httpRoomClient — notificação local imediata (sem esperar o polling)", () => {
  it("vote notifica um assinante de subscribeToRoom na hora, sem esperar o próximo tick", async () => {
    saveIdentity("abc1234", { participantId: "p1", isModerator: true, token: "token-secreto" });

    const initialResponse = jsonResponse(200, {
      code: "abc1234",
      name: "Sala",
      pointScale: "fibonacci",
      moderatorId: "p1",
      participants: [{ id: "p1", name: "Ana", isModerator: true, joinedAt: 1 }],
      createdAt: 1,
      lastActivityAt: 1,
      round: { state: "voting", voters: [] },
    });
    const afterVoteResponse = jsonResponse(200, {
      code: "abc1234",
      name: "Sala",
      pointScale: "fibonacci",
      moderatorId: "p1",
      participants: [{ id: "p1", name: "Ana", isModerator: true, joinedAt: 1 }],
      createdAt: 1,
      lastActivityAt: 2,
      round: { state: "voting", voters: ["p1"], myVote: "5" },
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(initialResponse).mockResolvedValueOnce(afterVoteResponse);
    vi.stubGlobal("fetch", fetchMock);

    const callback = vi.fn();
    const unsubscribe = httpRoomClient.subscribeToRoom("abc1234", callback);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

    await httpRoomClient.vote("abc1234", "p1", "5");

    // Nenhum novo fetch de polling rodou ainda (setInterval não disparou) —
    // a notificação veio direto da resposta de `vote`, não de um novo GET.
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[1][0]?.round.votes["p1"]).toBe("5");

    unsubscribe();
  });
});

describe("httpRoomClient — tratamento de erro (achado E1)", () => {
  it("converte corpo {code, message} reconhecido em RoomClientError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(404, { code: "ROOM_NOT_FOUND", message: "Essa sala não existe ou expirou." }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(httpRoomClient.vote("abc1234", "p1", "5")).rejects.toThrow(RoomClientError);
  });

  it("getRoom devolve null (não lança) quando a sala não é encontrada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(404, { code: "ROOM_NOT_FOUND", message: "Essa sala não existe ou expirou." }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(httpRoomClient.getRoom("inexistente")).resolves.toBeNull();
  });

  it("uma falha de fetch (rede indisponível) nunca vira RoomClientError", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    let caughtError: unknown;
    try {
      await httpRoomClient.vote("abc1234", "p1", "5");
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).not.toBeInstanceOf(RoomClientError);
    expect(caughtError).toBeInstanceOf(TypeError);
  });

  it("uma resposta 5xx sem corpo JSON reconhecido nunca vira RoomClientError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("Internal Server Error", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    let caughtError: unknown;
    try {
      await httpRoomClient.vote("abc1234", "p1", "5");
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).not.toBeInstanceOf(RoomClientError);
  });
});
