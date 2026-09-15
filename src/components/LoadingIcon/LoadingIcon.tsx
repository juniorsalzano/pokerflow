import styles from "./LoadingIcon.module.css";

interface LoadingIconProps {
  size?: number;
}

/**
 * Spinning variant of the brand mark (the tilted card rectangle used as the
 * PokerFlow logo) — reused as a loading indicator across the app instead of
 * a generic spinner. Always the brand purple (same token as the logo/favicon),
 * regardless of the surrounding text color.
 */
export default function LoadingIcon({ size = 24 }: LoadingIconProps) {
  return (
    <span className={styles.stage} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.spinner}>
        <rect x="18" y="12" width="28" height="40" rx="7" className={styles.shape} />
      </svg>
    </span>
  );
}
