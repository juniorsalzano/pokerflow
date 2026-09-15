import { avatarOf } from "../../services/avatar";
import { Participant } from "../../types/room";
import styles from "./Avatar.module.css";

interface AvatarProps {
  participant: Participant;
}

/**
 * Circle with the participant's initials (spec 004, FR-007) — stands in for
 * a profile photo, since PokerFlow has no accounts (research.md §5).
 * Deterministic color within PokerFlow's existing palette.
 */
export default function Avatar({ participant }: AvatarProps) {
  const { initials, color } = avatarOf(participant);
  return (
    <span
      className={styles.avatar}
      style={{ background: color }}
      title={participant.name}
      aria-label={participant.name}
    >
      {initials}
    </span>
  );
}
