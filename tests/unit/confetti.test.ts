import { describe, expect, it } from "vitest";
import { shouldShowConfetti } from "../../src/services/confetti";
import { RoundSummary } from "../../src/types/room";

function summary(result: RoundSummary["result"]): RoundSummary {
  return { votedCount: 0, notVoted: [], result };
}

describe("shouldShowConfetti (spec 004, FR-008/FR-009)", () => {
  it("true em consenso total", () => {
    expect(shouldShowConfetti(summary({ type: "consensus", value: "5" }))).toBe(true);
  });

  it("false em dispersão", () => {
    expect(shouldShowConfetti(summary({ type: "spread", min: "3", max: "8" }))).toBe(false);
  });

  it("false em no-consensus (inclui o caso de ninguém ter votado)", () => {
    expect(shouldShowConfetti(summary({ type: "no-consensus" }))).toBe(false);
  });
});
