/**
 * Renders a point-scale card's value. The "☕" value (Fibonacci scale's
 * break/uncertainty card, see src/types/room.ts) is drawn as a stroke-based
 * SVG cup icon (same style as the app's other icons) instead of the emoji
 * character — the project's Visual Identity requires "no decorative emoji"
 * (CLAUDE.md; research.md §3). The "?" value stays as plain text, since it
 * isn't an emoji.
 */
export default function CardValue({ value }: { value: string }) {
  if (value === "☕") {
    return (
      <svg
        width="1.1em"
        height="1.1em"
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label="Pausa / incerteza"
      >
        <path
          d="M4 9h13v5.5A5.5 5.5 0 0 1 11.5 20h-2A5.5 5.5 0 0 1 4 14.5V9Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M17 10.5h1.2a2.3 2.3 0 1 1 0 4.6H17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M7.5 6c0-.9.9-.9.9-1.8S7.5 3.3 7.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M11.5 6c0-.9.9-.9.9-1.8S11.5 3.3 11.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return <>{value}</>;
}
