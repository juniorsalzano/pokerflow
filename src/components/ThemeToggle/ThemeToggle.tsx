import { useTheme } from "../../hooks/useTheme";
import styles from "./ThemeToggle.module.css";

/** Alternância de tema claro/escuro (T036), persistida via useTheme. */
export default function ThemeToggle() {
  const { tema, alternar } = useTheme();
  const escuro = tema === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={escuro}
    >
      <span className={styles.thumb} style={{ marginLeft: escuro ? 24 : 0 }}>
        {escuro && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z"
              stroke="#150F22"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
