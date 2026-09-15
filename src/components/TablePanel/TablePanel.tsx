import { RevealPhase } from "../../hooks/useRevealTransition";
import LoadingIcon from "../LoadingIcon/LoadingIcon";
import styles from "./TablePanel.module.css";

interface TablePanelProps {
  phase: RevealPhase;
  /** 3, 2 or 1 during the "countdown" phase; ignored in other phases. */
  countdownNumber: number | null;
}

/**
 * Room screen's central panel ("the table", spec 004) — status only: a
 * simple message during voting, and a countdown on reveal. Never shows the
 * grouped result — it appears below the table, in place of "Suas cartas"
 * (see RoomPage), not here.
 */
export default function TablePanel({ phase, countdownNumber }: TablePanelProps) {
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
    </div>
  );
}
