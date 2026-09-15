import { Participant } from "../types/room";

/**
 * PokerFlow palette color tokens used for avatars (data-model.md
 * §AvatarInfo, research.md §5) — never colors outside the product's Visual
 * Identity (FR-010).
 */
const AVATAR_COLORS = ["var(--accent-a)", "var(--accent-b)", "var(--btn-a)", "var(--btn-b)"] as const;

export interface AvatarInfo {
  initials: string;
  color: string;
}

/**
 * A name's initials: first letter of the first "token" and of the last,
 * uppercase. Single-word names only use their first letter.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Shortens a long name for display in tight spaces (e.g. the seat card
 * grid), keeping the first and last name in full and reducing any name(s)
 * in between to a single uppercase initial — e.g. "Edson Roberto Salzano
 * Junior" becomes "Edson R S Junior". Names with up to two parts are
 * returned unchanged, since there's nothing to shorten.
 */
export function shortenName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  const first = parts[0];
  const last = parts[parts.length - 1];
  const middleInitials = parts.slice(1, -1).map((part) => part.charAt(0).toUpperCase());
  return [first, ...middleInitials, last].join(" ");
}

/** Simple, deterministic hash of a string, used to pick the avatar color. */
function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * A participant's deterministic avatar (the same participant always
 * produces the same avatar within a session) — initials + a color from
 * PokerFlow's palette, since the product has no accounts nor profile
 * photos (research.md §5).
 */
export function avatarOf(participant: Participant): AvatarInfo {
  const color = AVATAR_COLORS[hash(participant.id) % AVATAR_COLORS.length];
  return { initials: initialsOf(participant.name), color };
}
