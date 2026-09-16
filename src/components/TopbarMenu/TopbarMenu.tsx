import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import styles from "./TopbarMenu.module.css";

interface TopbarMenuProps {
  onLeave: () => void;
}

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="19" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Shows the icon of the theme you'll SWITCH TO (sun while dark, moon while light) — matches the label next to it. */
function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Groups low-frequency/secondary room actions (theme, leave) behind a
 * kebab menu — keeps the topbar down to just the primary action ("Convidar
 * time") plus this trigger, instead of three differently-shaped controls
 * sitting side by side. Absolutely positioned panel: never affects topbar
 * height/layout when it opens or closes (no layout shift either way).
 */
export default function TopbarMenu({ onLeave }: TopbarMenuProps) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dark = theme === "dark";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções"
        title="Mais opções"
      >
        <KebabIcon />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => {
              toggle();
              setOpen(false);
            }}
          >
            <ThemeIcon dark={dark} />
            {dark ? "Tema claro" : "Tema escuro"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.item} ${styles.itemDanger}`}
            onClick={() => {
              setOpen(false);
              onLeave();
            }}
          >
            <LeaveIcon />
            Sair da sala
          </button>
        </div>
      )}
    </div>
  );
}
