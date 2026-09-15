import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRevealTransition } from "../../src/hooks/useRevealTransition";
import { RoundState } from "../../src/types/room";

type Props = { state: RoundState };

function mount(participantCount: number, handCardCount: number, initialState: RoundState = "voting") {
  return renderHook<ReturnType<typeof useRevealTransition>, Props>(
    ({ state }) => useRevealTransition(state, participantCount, handCardCount),
    { initialProps: { state: initialState } },
  );
}

describe("useRevealTransition — máquina de fases (data-model.md §RevealPhase)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("começa em 'voting' quando a rodada está aberta", () => {
    const { result } = renderHook(() => useRevealTransition("voting", 2, 10));
    expect(result.current.phase).toBe("voting");
    expect(result.current.countdownNumber).toBeNull();
  });

  it("ao revelar, percorre countdown (3,2,1) → flipping → leaving → result, nessa ordem", () => {
    const { result, rerender } = mount(2, 3);

    rerender({ state: "revealed" });
    expect(result.current.phase).toBe("countdown");
    expect(result.current.countdownNumber).toBe(3);

    act(() => vi.advanceTimersByTime(700));
    expect(result.current.countdownNumber).toBe(2);

    act(() => vi.advanceTimersByTime(700));
    expect(result.current.countdownNumber).toBe(1);

    act(() => vi.advanceTimersByTime(700));
    expect(result.current.phase).toBe("flipping");
    expect(result.current.countdownNumber).toBeNull();

    // flipping: staggeredDurationMs(2 participantes, 500) = (2-1)*60 + 500 + 150 = 710ms
    act(() => vi.advanceTimersByTime(710));
    expect(result.current.phase).toBe("leaving");

    // leaving: staggeredDurationMs(3 cartas na mão, 350) = (3-1)*60 + 350 + 150 = 620ms
    act(() => vi.advanceTimersByTime(620));
    expect(result.current.phase).toBe("result");
  });

  it("'flipping' escalona pela quantidade de PARTICIPANTES, não pela mão de cartas", () => {
    const { result, rerender } = mount(10, 1);

    rerender({ state: "revealed" });
    act(() => vi.advanceTimersByTime(700 * 3));
    expect(result.current.phase).toBe("flipping");

    // staggeredDurationMs(10 participantes, 500) = (10-1)*60 + 500 + 150 = 1190ms — ainda em "flipping"
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.phase).toBe("flipping");
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.phase).toBe("leaving");
  });

  it("'leaving' escalona pela quantidade de CARTAS NA MÃO, não pelos participantes", () => {
    const { result, rerender } = mount(1, 10);

    rerender({ state: "revealed" });
    act(() => vi.advanceTimersByTime(700 * 3));
    // flipping: staggeredDurationMs(1 participante, 500) = 0+500+150 = 650ms
    act(() => vi.advanceTimersByTime(650));
    expect(result.current.phase).toBe("leaving");

    // staggeredDurationMs(10 cartas, 350) = (10-1)*60 + 350 + 150 = 1040ms — ainda em "leaving"
    act(() => vi.advanceTimersByTime(900));
    expect(result.current.phase).toBe("leaving");
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.phase).toBe("result");
  });

  it("resetar a partir de 'result' passa por 'returning' e assenta em 'voting'", () => {
    const { result, rerender } = mount(1, 1);

    rerender({ state: "revealed" });
    // countdown (2100) + flipping (650) + leaving (500) = 3250ms até "result"
    act(() => vi.advanceTimersByTime(3250));
    expect(result.current.phase).toBe("result");

    rerender({ state: "voting" });
    expect(result.current.phase).toBe("returning");

    // returning: staggeredDurationMs(1 carta, 400) = 0+400+150 = 550ms
    act(() => vi.advanceTimersByTime(550));
    expect(result.current.phase).toBe("voting");
  });

  it("reset disparado no meio do countdown cancela os timers pendentes e não deixa a fase presa (FR-014)", () => {
    const { result, rerender } = mount(3, 5);

    rerender({ state: "revealed" });
    act(() => vi.advanceTimersByTime(700)); // ainda no countdown, mostrando "2"
    expect(result.current.phase).toBe("countdown");

    rerender({ state: "voting" }); // reset disparado no meio do countdown
    expect(result.current.phase).toBe("returning");
    expect(result.current.countdownNumber).toBeNull();

    // Avança bastante tempo — se os timers antigos não tivessem sido cancelados,
    // a fase poderia "pular" sozinha para countdown/flipping/leaving/result.
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.phase).toBe("voting");
  });

  it("resetar quando já se está em 'voting' não dispara uma fase 'returning' espúria", () => {
    const { result, rerender } = mount(1, 1);

    rerender({ state: "voting" });
    expect(result.current.phase).toBe("voting");
  });
});
