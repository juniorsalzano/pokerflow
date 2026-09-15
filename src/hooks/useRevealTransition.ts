import { useEffect, useRef, useState } from "react";
import { CARD_STAGGER_MS } from "../components/SeatCard/SeatCard";
import { RoundState } from "../types/room";

/** Presentation phases of the reveal (data-model.md §RevealPhase). Purely
 * UI-side — never persisted nor sent to any client/server. */
export type RevealPhase = "voting" | "countdown" | "flipping" | "leaving" | "result" | "returning";

/** Duration of each countdown number (3, 2, 1), in ms. */
const COUNTDOWN_STEP_MS = 700;
/** Duration of a seat card's individual flip (mirrors SeatCard.module.css `.flipper`). */
const FLIP_DURATION_MS = 500;
/** Duration of a hand card's fade/shrink-out ("Suas cartas", mirrors HandOfCards.module.css `.itemLeaving`). */
const LEAVE_DURATION_MS = 350;
/** Duration of a hand card's staggered entrance (mirrors HandOfCards.module.css `.itemEntering`). */
const ENTER_DURATION_MS = 400;
/** Safety margin beyond the last item (the one with the largest `transitionDelay`)
 * before considering a batch of transitions finished. */
const SAFETY_MARGIN_MS = 150;

interface RevealTransitionResult {
  phase: RevealPhase;
  /** 3, 2 or 1 during the "countdown" phase; `null` outside of it. */
  countdownNumber: number | null;
}

/** Total time until the last item (largest `transitionDelay`) finishes a
 * transition of duration `durationMs`, staggered by `CARD_STAGGER_MS`. */
function staggeredDurationMs(itemCount: number, durationMs: number): number {
  const largestDelay = Math.max(0, itemCount - 1) * CARD_STAGGER_MS;
  return largestDelay + durationMs + SAFETY_MARGIN_MS;
}

/**
 * Translates `room.round.state` (spec 002, already tested and unchanged by
 * this feature) into a local sequence of presentation phases:
 *
 *   "voting" → (reveal) → "countdown" → "flipping" → "leaving" → "result"
 *   "result" → (reset) → "returning" → "voting"
 *
 * "flipping" is the seat cards' individual flip (values become visible,
 * spec 002) — staggers by `participantCount`. "leaving" is "Suas cartas"
 * (the hand) fading away in cascade to make room for the grouped result
 * panel, which takes its place (FR-006) — staggers by `handCardCount`
 * (number of point-scale values, not participants: they're different
 * grids). The seat grid never leaves the screen — it stays visible around
 * the table (only flips in place).
 *
 * Reset at any moment forces the phase to "returning", canceling any
 * pending timers from a previous transition (FR-014). Doesn't decide any
 * business rule nor read `round.votes` — only orchestrates when each visual
 * phase starts and ends.
 *
 * Assumed simplification: a participant who opens the room with the round
 * already revealed also sees the countdown play once (the hook doesn't
 * distinguish a "live reveal" from "I just arrived") — keeps the logic
 * single and predictable, without extra state just for that distinction.
 */
export function useRevealTransition(
  state: RoundState | undefined,
  participantCount: number = 0,
  handCardCount: number = 0,
): RevealTransitionResult {
  const [phase, setPhase] = useState<RevealPhase>("voting");
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previousStateRef = useRef<RoundState | undefined>(undefined);

  useEffect(() => {
    const previous = previousStateRef.current;
    previousStateRef.current = state;

    function clearTimeouts() {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    }

    function schedule(fn: () => void, ms: number) {
      timeoutsRef.current.push(setTimeout(fn, ms));
    }

    const revealing = state === "revealed" && previous !== "revealed";
    const resetting = state === "voting" && previous !== undefined && previous !== "voting";

    if (revealing) {
      clearTimeouts();
      setPhase("countdown");
      setCountdownNumber(3);
      schedule(() => setCountdownNumber(2), COUNTDOWN_STEP_MS);
      schedule(() => setCountdownNumber(1), COUNTDOWN_STEP_MS * 2);

      const flippingStart = COUNTDOWN_STEP_MS * 3;
      schedule(() => {
        setCountdownNumber(null);
        setPhase("flipping");
      }, flippingStart);

      const leavingStart = flippingStart + staggeredDurationMs(participantCount, FLIP_DURATION_MS);
      schedule(() => setPhase("leaving"), leavingStart);

      const resultStart = leavingStart + staggeredDurationMs(handCardCount, LEAVE_DURATION_MS);
      schedule(() => setPhase("result"), resultStart);
    } else if (resetting) {
      clearTimeouts();
      setCountdownNumber(null);
      setPhase("returning");
      schedule(
        () => setPhase("voting"),
        staggeredDurationMs(handCardCount, ENTER_DURATION_MS),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Cancels any pending timers on unmount (room change/navigation).
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  return { phase, countdownNumber };
}
