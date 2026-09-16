import { RevealPhase } from "../../hooks/useRevealTransition";
import CardValue from "../CardValue/CardValue";
import LoadingIcon from "../LoadingIcon/LoadingIcon";
import styles from "./TablePanel.module.css";

interface MostVoted {
  value: string;
  /** How many participants voted this value. */
  count: number;
  /** Total participants in the room (denominator for "X de Y votos"). */
  total: number;
}

interface TablePanelProps {
  phase: RevealPhase;
  /** 3, 2 or 1 during the "countdown" phase; ignored in other phases. */
  countdownNumber: number | null;
  /** Shown only during "result" — the grouped breakdown itself lives below (GroupedResult), this is just a highlight so the table isn't empty. */
  mostVoted?: MostVoted;
}

/**
 * Room screen's central panel ("the table", spec 004) — status only: a
 * simple message during voting, a countdown on reveal, and (spec 005-adjacent
 * polish) a highlight of the most-voted value once the result is in, so the
 * table doesn't sit empty right when everyone's looking at it. Never shows
 * the full grouped result — that appears below the table, in place of "Suas
 * cartas" (see RoomPage), not here.
 */
export default function TablePanel({ phase, countdownNumber, mostVoted }: TablePanelProps) {
  return (
    <div className={styles.panel} aria-live="polite">
      {phase === "voting" && <p className={styles.status}>Escolham as cartas para votar.</p>}

      {phase === "countdown" && countdownNumber !== null && (
        <span key={countdownNumber} className={styles.countdownNumber}>
          {countdownNumber}
        </span>
      )}

      {(phase === "flipping" || phase === "leaving") && (
        <p className={`${styles.status} ${styles.statusRow}`}>
          <LoadingIcon size={24} />
          Revelando…
        </p>
      )}

      {phase === "result" && mostVoted && (
        <div className={styles.mostVoted}>
          <span className={styles.mostVotedLabel}>Mais votado</span>
          <span className={styles.mostVotedValue}>
            <CardValue value={mostVoted.value} />
          </span>
          <span className={styles.mostVotedCount}>
            {mostVoted.count} de {mostVoted.total} {mostVoted.total === 1 ? "voto" : "votos"}
          </span>
        </div>
      )}
    </div>
  );
}
