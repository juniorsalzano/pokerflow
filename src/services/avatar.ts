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
