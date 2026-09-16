import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useJoinRoom } from "../../src/hooks/useJoinRoom";
import { roomClient } from "../../src/services/roomClient";
import { RoomClientError } from "../../src/types/room";

vi.mock("../../src/services/roomClient", () => ({
  roomClient: { joinRoom: vi.fn() },
}));

const joinRoomMock = vi.mocked(roomClient.joinRoom);

describe("useJoinRoom — mensagem de nome duplicado (spec 005, US4, FR-008)", () => {
  it("substitui a mensagem de DUPLICATE_NAME por uma que considera a própria tentativa anterior, sem afirmar que é outra pessoa", async () => {
    joinRoomMock.mockRejectedValue(
      new RoomClientError("DUPLICATE_NAME", "Já existe alguém nessa sala com esse nome. Escolha outro."),
    );
    const { result } = renderHook(() => useJoinRoom("abc1234"));

    await act(async () => {
      await result.current.join("Ana");
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).not.toContain("Já existe alguém");
    expect(result.current.error).toMatch(/tentativa/i);
  });

  it("mantém a mensagem original do servidor para outros códigos de erro (regressão)", async () => {
    joinRoomMock.mockRejectedValue(new RoomClientError("INVALID_INPUT", "Nome inválido."));
    const { result } = renderHook(() => useJoinRoom("abc1234"));

    await act(async () => {
      await result.current.join("");
    });

    await waitFor(() => expect(result.current.error).toBe("Nome inválido."));
  });

  it("continua com a mensagem genérica para erros que não são de negócio (regressão)", async () => {
    joinRoomMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useJoinRoom("abc1234"));

    await act(async () => {
      await result.current.join("Ana");
    });

    await waitFor(() => expect(result.current.error).toBe("Não foi possível entrar na sala. Tente novamente."));
  });
});
