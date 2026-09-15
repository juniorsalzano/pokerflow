import { useTheme } from "../../hooks/useTheme";
import styles from "./ThemeToggle.module.css";

/** Light/dark theme toggle (T036), persisted via useTheme. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={dark}
    >
      <span className={styles.thumb} style={{ marginLeft: dark ? 24 : 0 }}>
        {dark && (
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
