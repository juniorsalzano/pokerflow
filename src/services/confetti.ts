import { RoundSummary } from "../types/room";

/**
 * true only in total consensus (spec 004, FR-008/FR-009) — no confetti on
 * spread, "no-consensus", or when nobody voted. A pure function, separate
 * from `fireConfetti` so it's testable without depending on the real burst
 * (research.md §1 — the actual `canvas-confetti` call is validated manually
 * via quickstart.md).
 */
export function shouldShowConfetti(summary: RoundSummary): boolean {
  return summary.result.type === "consensus";
}

/**
 * Fires a short confetti burst (a few seconds, not continuous confetti),
 * using PokerFlow's existing color palette — a deliberate, one-off
 * exception to the Visual Identity's "no excessive animation/confetti"
 * guideline, limited to this moment (see CLAUDE.md, spec.md §Assumptions).
 * Dynamic import: the library only enters the bundle when there's actually
 * a consensus to celebrate (research.md §1).
 */
export async function fireConfetti(): Promise<void> {
  const { default: confetti } = await import("canvas-confetti");
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    ticks: 140,
    origin: { y: 0.6 },
    colors: ["#8b5cf6", "#f472b6", "#7c3aed", "#db2777"],
  });
}
