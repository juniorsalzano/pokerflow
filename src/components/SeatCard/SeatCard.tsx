import { Participant } from "../../types/room";
import CardValue from "../CardValue/CardValue";
import styles from "./SeatCard.module.css";

/**
 * Delay between one seat card's flip and the next, in ms (staggers the
 * reveal animation by index). Exported so `useRevealTransition` can compute
 * how long to wait before considering the individual flip finished
 * (data-model.md §RevealPhase) without duplicating the magic number.
 */
export const CARD_STAGGER_MS = 60;

interface SeatCardProps {
  participant: Participant;
  /** Value voted by this participant, if any — undefined = hasn't voted yet. */
  vote?: string;
  /** true once the moderator has revealed the current round. */
  revealed: boolean;
  /** true when this seat represents this tab's own user (FR-004a). */
  isMe: boolean;
  /** index in the list, used to stagger the flip animation on reveal (research.md §1). */
  index?: number;
}

/**
 * Per-participant status card, always visible around the table (spec 004) —
 * doesn't leave the screen on reveal; only flips in place. Possible states:
 * - empty: participant hasn't voted yet.
 * - hidden (back): participant has voted, but the value is NOT shown — not
 *   even in the DOM — to anyone other than the vote's owner while the round
 *   hasn't been revealed yet (FR-003/FR-004/SC-002, the feature's most
 *   critical requirement).
 * - revealed: the value becomes visible, either because the round was
 *   revealed (`revealed`) or because this is the user's own seat (`isMe`,
 *   FR-004a — secrecy only applies to OTHER participants).
 */
export default function SeatCard({ participant, vote, revealed, isMe, index = 0 }: SeatCardProps) {
  const hasVoted = vote !== undefined;
  const showValue = hasVoted && (revealed || isMe);

  const visualState = !hasVoted ? "empty" : showValue ? "revealed" : "hidden";

  const cardClass = [styles.card, styles[visualState], isMe && styles.isMe]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={styles.item}>
      <div
        className={cardClass}
        style={{
          transitionDelay: visualState === "revealed" ? `${index * CARD_STAGGER_MS}ms` : "0ms",
        }}
        aria-label={
          !hasVoted
            ? `${participant.name}: ainda não votou`
            : showValue
              ? `${participant.name}: votou ${vote}`
              : `${participant.name}: já votou`
        }
      >
        <div className={styles.flipper}>
          <div className={styles.cardBack} aria-hidden={showValue}>
            <span className={styles.backMark} />
          </div>
          <div className={styles.cardFront} aria-hidden={!showValue}>
            {showValue && vote !== undefined && <CardValue value={vote} />}
          </div>
        </div>
      </div>
      <span className={[styles.name, isMe && styles.isMe].filter(Boolean).join(" ")}>
        {participant.name}
        {isMe && " (você)"}
      </span>
      {revealed && !hasVoted && <span className={styles.notVoted}>Não votou</span>}
    </li>
  );
}
