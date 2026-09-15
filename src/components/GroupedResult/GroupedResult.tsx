import Avatar from "../Avatar/Avatar";
import CardValue from "../CardValue/CardValue";
import { ResultDistribution } from "../../types/room";
import styles from "./GroupedResult.module.css";

interface GroupedResultProps {
  distribution: ResultDistribution;
  /** When present, shows the "Votar novamente" button below the chart —
   * only the caller (RoomPage) decides whether the viewer is the moderator. */
  onReset?: () => void;
}

function notVotedText(count: number): string {
  if (count === 1) return "1 participante não votou nesta rodada.";
  return `${count} participantes não votaram nesta rodada.`;
}

/** "Vote again" icon (circular arrow). */
function VoteAgainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5M20 8.5V4M20 8.5h-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5M4 15.5V20M4 15.5h4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Result panel grouped by voted value (spec 004, FR-007/FR-011/FR-012) — a
 * stack chart per value: the column's height is the vote count, and each
 * "chip" in the stack is the avatar of who voted, so it's possible to
 * discuss afterward why someone voted differently. Doesn't read
 * `round.votes` directly: receives the already-computed distribution
 * (`groupByValue`), without deciding secrecy — the caller (RoomPage) only
 * builds this distribution after the round is revealed.
 */
export default function GroupedResult({ distribution, onReset }: GroupedResultProps) {
  const { groups, notVoted } = distribution;

  if (groups.length === 0) {
    return (
      <div className={styles.result}>
        <p className={styles.empty}>Ninguém votou nesta rodada.</p>
        {onReset && (
          <button type="button" className={styles.voteAgain} onClick={onReset}>
            <VoteAgainIcon />
            Votar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.result}>
      <ul className={styles.chart} aria-label="Gráfico de votos por valor">
        {groups.map((group) => (
          <li key={group.value} className={styles.column}>
            <span className={styles.count}>{group.participants.length}</span>
            <ul className={styles.stack} aria-label={`Votaram ${group.value}`}>
              {group.participants.map((participant) => (
                <li key={participant.id}>
                  <Avatar participant={participant} />
                </li>
              ))}
            </ul>
            <span className={styles.cardValue}>
              <CardValue value={group.value} />
            </span>
          </li>
        ))}
      </ul>
      {notVoted.length > 0 && <p className={styles.notVoted}>{notVotedText(notVoted.length)}</p>}
      {onReset && (
        <button type="button" className={styles.voteAgain} onClick={onReset}>
          <VoteAgainIcon />
          Votar novamente
        </button>
      )}
    </div>
  );
}
