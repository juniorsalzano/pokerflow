import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePresence } from "../../src/hooks/usePresence";
import { roomClient } from "../../src/services/roomClient";

vi.mock("../../src/services/roomClient", () => ({
  roomClient: { sendHeartbeat: vi.fn() },
}));

const sendHeartbeatMock = vi.mocked(roomClient.sendHeartbeat);

beforeEach(() => {
  vi.useFakeTimers();
  sendHeartbeatMock.mockReset();
  sendHeartbeatMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePresence", () => {
  it("não envia presença sem code/participantId", () => {
    renderHook(() => usePresence(undefined, undefined));
    vi.advanceTimersByTime(120_000);
    expect(sendHeartbeatMock).not.toHaveBeenCalled();
  });

  it("envia presença a cada 45s enquanto montado, com code e participantId", () => {
    renderHook(() => usePresence("abc1234", "p1"));

    expect(sendHeartbeatMock).not.toHaveBeenCalled(); // nada imediato no mount

    vi.advanceTimersByTime(45_000);
    expect(sendHeartbeatMock).toHaveBeenCalledTimes(1);
    expect(sendHeartbeatMock).toHaveBeenCalledWith("abc1234", "p1");

    vi.advanceTimersByTime(45_000);
    expect(sendHeartbeatMock).toHaveBeenCalledTimes(2);
  });

  it("limpa o intervalo no unmount — nenhuma chamada depois de desmontar", () => {
    const { unmount } = renderHook(() => usePresence("abc1234", "p1"));
    unmount();

    vi.advanceTimersByTime(120_000);
    expect(sendHeartbeatMock).not.toHaveBeenCalled();
  });

  it("uma falha em sendHeartbeat não propaga (heartbeat perdido não deve quebrar a sessão)", async () => {
    sendHeartbeatMock.mockRejectedValue(new Error("network error"));
    renderHook(() => usePresence("abc1234", "p1"));

    await vi.advanceTimersByTimeAsync(45_000);
    expect(sendHeartbeatMock).toHaveBeenCalledTimes(1);
  });
});
