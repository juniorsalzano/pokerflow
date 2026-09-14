import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePresenca } from "../../src/hooks/usePresenca";
import { roomClient } from "../../src/services/roomClient";

vi.mock("../../src/services/roomClient", () => ({
  roomClient: { enviarPresenca: vi.fn() },
}));

const enviarPresencaMock = vi.mocked(roomClient.enviarPresenca);

beforeEach(() => {
  vi.useFakeTimers();
  enviarPresencaMock.mockReset();
  enviarPresencaMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePresenca", () => {
  it("não envia presença sem codigo/participanteId", () => {
    renderHook(() => usePresenca(undefined, undefined));
    vi.advanceTimersByTime(120_000);
    expect(enviarPresencaMock).not.toHaveBeenCalled();
  });

  it("envia presença a cada 45s enquanto montado, com codigo e participanteId", () => {
    renderHook(() => usePresenca("abc1234", "p1"));

    expect(enviarPresencaMock).not.toHaveBeenCalled(); // nada imediato no mount

    vi.advanceTimersByTime(45_000);
    expect(enviarPresencaMock).toHaveBeenCalledTimes(1);
    expect(enviarPresencaMock).toHaveBeenCalledWith("abc1234", "p1");

    vi.advanceTimersByTime(45_000);
    expect(enviarPresencaMock).toHaveBeenCalledTimes(2);
  });

  it("limpa o intervalo no unmount — nenhuma chamada depois de desmontar", () => {
    const { unmount } = renderHook(() => usePresenca("abc1234", "p1"));
    unmount();

    vi.advanceTimersByTime(120_000);
    expect(enviarPresencaMock).not.toHaveBeenCalled();
  });

  it("uma falha em enviarPresenca não propaga (heartbeat perdido não deve quebrar a sessão)", async () => {
    enviarPresencaMock.mockRejectedValue(new Error("network error"));
    renderHook(() => usePresenca("abc1234", "p1"));

    await vi.advanceTimersByTimeAsync(45_000);
    expect(enviarPresencaMock).toHaveBeenCalledTimes(1);
  });
});
