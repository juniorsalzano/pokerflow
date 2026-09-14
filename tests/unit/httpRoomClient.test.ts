import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpRoomClient } from "../../src/services/http/httpRoomClient";
import { salvarIdentidade } from "../../src/hooks/useModerator";
import { RoomClientError } from "../../src/types/room";

const BASE_URL = "http://localhost:3000/planning-poker";

function respostaJson(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("httpRoomClient — montagem de requisições", () => {
  it("criarSala faz POST /rooms com o corpo certo e devolve token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(201, {
        codigo: "abc1234",
        participanteId: "p1",
        token: "token-secreto",
        sala: {
          codigo: "abc1234",
          nome: "Sala",
          escalaPontos: "fibonacci",
          moderadorId: "p1",
          participantes: [{ id: "p1", nome: "Ana", ehModerador: true, entrouEm: 1 }],
          criadaEm: 1,
          ultimaAtividadeEm: 1,
          rodada: { estado: "votando", votantes: [] },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await httpRoomClient.criarSala({
      nomeSala: "Sala",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nomeSala: "Sala", nomeCriador: "Ana", escalaPontos: "fibonacci" }),
      }),
    );
    expect(resultado.token).toBe("token-secreto");
    expect(resultado.codigo).toBe("abc1234");
  });

  it("votar envia participanteId, token e valor no corpo", async () => {
    salvarIdentidade("abc1234", { participanteId: "p1", ehModerador: true, token: "token-secreto" });
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(200, {
        codigo: "abc1234",
        nome: "Sala",
        escalaPontos: "fibonacci",
        moderadorId: "p1",
        participantes: [{ id: "p1", nome: "Ana", ehModerador: true, entrouEm: 1 }],
        criadaEm: 1,
        ultimaAtividadeEm: 1,
        rodada: { estado: "votando", votantes: ["p1"], meuVoto: "5" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await httpRoomClient.votar("abc1234", "p1", "5");

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms/abc1234/votos`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participanteId: "p1", token: "token-secreto", valor: "5" }),
      }),
    );
  });

  it("obterSala manda participanteId e token na query quando a identidade existe", async () => {
    salvarIdentidade("abc1234", { participanteId: "p1", ehModerador: true, token: "token-secreto" });
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(200, {
        codigo: "abc1234",
        nome: "Sala",
        escalaPontos: "fibonacci",
        moderadorId: "p1",
        participantes: [{ id: "p1", nome: "Ana", ehModerador: true, entrouEm: 1 }],
        criadaEm: 1,
        ultimaAtividadeEm: 1,
        rodada: { estado: "votando", votantes: [] },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await httpRoomClient.obterSala("abc1234");

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/rooms/abc1234?participanteId=p1&token=token-secreto`,
      expect.anything(),
    );
  });
});

describe("httpRoomClient — reconstrução de votos a partir do payload redigido", () => {
  it("usa o valor real só para o próprio voto; placeholder não-vazio para os demais, antes do reveal", async () => {
    salvarIdentidade("abc1234", { participanteId: "eu", ehModerador: false, token: "meu-token" });
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(200, {
        codigo: "abc1234",
        nome: "Sala",
        escalaPontos: "fibonacci",
        moderadorId: "outro",
        participantes: [
          { id: "eu", nome: "Eu", ehModerador: false, entrouEm: 1 },
          { id: "outro", nome: "Outro", ehModerador: true, entrouEm: 1 },
        ],
        criadaEm: 1,
        ultimaAtividadeEm: 1,
        rodada: { estado: "votando", votantes: ["eu", "outro"], meuVoto: "5" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const sala = await httpRoomClient.obterSala("abc1234");

    expect(sala?.rodada.votos["eu"]).toBe("5");
    // O servidor nunca incluiu o valor real de "outro" no payload (mock acima só
    // tem meuVoto) — o placeholder é só pra manter "já votou" visível no SeatCard.
    expect(sala?.rodada.votos["outro"]).toBeDefined();
    expect(sala?.rodada.votos["outro"]).not.toBe("5");
  });

  it("usa o mapa completo de votos quando a rodada foi revelada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(200, {
        codigo: "abc1234",
        nome: "Sala",
        escalaPontos: "fibonacci",
        moderadorId: "p1",
        participantes: [
          { id: "p1", nome: "Ana", ehModerador: true, entrouEm: 1 },
          { id: "p2", nome: "Bia", ehModerador: false, entrouEm: 1 },
        ],
        criadaEm: 1,
        ultimaAtividadeEm: 1,
        rodada: { estado: "revelada", votantes: ["p1", "p2"], votos: { p1: "5", p2: "8" } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const sala = await httpRoomClient.obterSala("abc1234");

    expect(sala?.rodada.votos).toEqual({ p1: "5", p2: "8" });
  });
});

describe("httpRoomClient — notificação local imediata (sem esperar o polling)", () => {
  it("votar notifica um assinante de assinarSala na hora, sem esperar o próximo tick", async () => {
    salvarIdentidade("abc1234", { participanteId: "p1", ehModerador: true, token: "token-secreto" });

    const respostaInicial = respostaJson(200, {
      codigo: "abc1234",
      nome: "Sala",
      escalaPontos: "fibonacci",
      moderadorId: "p1",
      participantes: [{ id: "p1", nome: "Ana", ehModerador: true, entrouEm: 1 }],
      criadaEm: 1,
      ultimaAtividadeEm: 1,
      rodada: { estado: "votando", votantes: [] },
    });
    const respostaAposVotar = respostaJson(200, {
      codigo: "abc1234",
      nome: "Sala",
      escalaPontos: "fibonacci",
      moderadorId: "p1",
      participantes: [{ id: "p1", nome: "Ana", ehModerador: true, entrouEm: 1 }],
      criadaEm: 1,
      ultimaAtividadeEm: 2,
      rodada: { estado: "votando", votantes: ["p1"], meuVoto: "5" },
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(respostaInicial).mockResolvedValueOnce(respostaAposVotar);
    vi.stubGlobal("fetch", fetchMock);

    const callback = vi.fn();
    const cancelar = httpRoomClient.assinarSala("abc1234", callback);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

    await httpRoomClient.votar("abc1234", "p1", "5");

    // Nenhum novo fetch de polling rodou ainda (setInterval não disparou) —
    // a notificação veio direto da resposta de `votar`, não de um novo GET.
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[1][0]?.rodada.votos["p1"]).toBe("5");

    cancelar();
  });
});

describe("httpRoomClient — tratamento de erro (achado E1)", () => {
  it("converte corpo {codigo, mensagem} reconhecido em RoomClientError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(404, { codigo: "SALA_NAO_ENCONTRADA", mensagem: "Essa sala não existe ou expirou." }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(httpRoomClient.votar("abc1234", "p1", "5")).rejects.toThrow(RoomClientError);
  });

  it("obterSala devolve null (não lança) quando a sala não é encontrada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(404, { codigo: "SALA_NAO_ENCONTRADA", mensagem: "Essa sala não existe ou expirou." }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(httpRoomClient.obterSala("inexistente")).resolves.toBeNull();
  });

  it("uma falha de fetch (rede indisponível) nunca vira RoomClientError", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    let erroCapturado: unknown;
    try {
      await httpRoomClient.votar("abc1234", "p1", "5");
    } catch (e) {
      erroCapturado = e;
    }
    expect(erroCapturado).not.toBeInstanceOf(RoomClientError);
    expect(erroCapturado).toBeInstanceOf(TypeError);
  });

  it("uma resposta 5xx sem corpo JSON reconhecido nunca vira RoomClientError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("Internal Server Error", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    let erroCapturado: unknown;
    try {
      await httpRoomClient.votar("abc1234", "p1", "5");
    } catch (e) {
      erroCapturado = e;
    }
    expect(erroCapturado).not.toBeInstanceOf(RoomClientError);
  });
});
