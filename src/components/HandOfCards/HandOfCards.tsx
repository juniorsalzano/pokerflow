import { CARD_STAGGER_MS } from "../SeatCard/SeatCard";
import CardValue from "../CardValue/CardValue";
import styles from "./HandOfCards.module.css";

interface HandOfCardsProps {
  values: string[];
  selectedValue?: string;
  disabled?: boolean;
  onVote: (value: string) => void;
  /** true during the "leaving" phase — the hand fades away in cascade, making
   * room for the grouped result panel that takes its place (spec 004, FR-006). */
  leaving?: boolean;
  /** true during the "returning" phase — the hand comes back in cascade,
   * entering from below (spec 004, História 4). */
  entering?: boolean;
}

/**
 * Own participant's clickable deck (US1). Clicking a card registers/changes
 * the vote (FR-002/FR-005) — the chosen card flips with a 3D effect
 * (`HandOfCards.module.css`, research.md §1) as immediate visual feedback.
 * `disabled` blocks new clicks after the reveal (FR-009). `leaving`/
 * `entering` orchestrate the transition with the grouped result panel
 * (spec 004) — the caller (RoomPage) decides WHEN to swap in the result,
 * this component only animates the exit/return.
 */
export default function HandOfCards({
  values,
  selectedValue,
  disabled,
  onVote,
  leaving = false,
  entering = false,
}: HandOfCardsProps) {
  return (
    <ul className={styles.hand} aria-label="Suas cartas">
      {values.map((value, index) => {
        const selected = value === selectedValue;
        const itemClass = [leaving && styles.itemLeaving, entering && styles.itemEntering]
          .filter(Boolean)
          .join(" ");
        return (
          <li
            key={value}
            className={itemClass || undefined}
            style={
              leaving || entering ? { transitionDelay: `${index * CARD_STAGGER_MS}ms` } : undefined
            }
          >
            <button
              type="button"
              className={[styles.card, selected && styles.selected].filter(Boolean).join(" ")}
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onVote(value)}
            >
              <span className={styles.flipper}>
                <span className={styles.cardFront}>
                  <CardValue value={value} />
                </span>
                {/* Purely visual duplicate of the flip effect — same value as
                    the front face, so it's hidden from screen readers (avoids
                    announcing the same value twice). */}
                <span className={styles.cardBack} aria-hidden="true">
                  <CardValue value={value} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
