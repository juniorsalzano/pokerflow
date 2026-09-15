import { RoundState } from "../../types/room";
import styles from "./RoundControls.module.css";

interface RoundControlsProps {
  state: RoundState;
  onReveal: () => void;
  onReset: () => void;
  loading?: boolean;
}

/**
 * Reveal/Reset buttons — the caller (RoomPage) only renders this component
 * when `isModerator` is true (defense in depth, since
 * `roomStore.reveal`/`reset` also validate the moderator — research.md §4).
 * "Revelar" only makes sense while the round is open; "Resetar" is accepted
 * in any state (FR-012). Both buttons stay mounted at all times (never
 * disappear from the layout) so nothing below shifts on a state change —
 * "Revelar" only becomes disabled once the round has been revealed.
 */
export default function RoundControls({ state, onReveal, onReset, loading }: RoundControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.reveal}
        onClick={onReveal}
        disabled={state !== "voting" || loading}
      >
        Revelar
      </button>
      <button type="button" className={styles.reset} onClick={onReset} disabled={loading}>
        Resetar
      </button>
    </div>
  );
}
