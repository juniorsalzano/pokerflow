const ROOM_NAME_MAX = 60;
const PARTICIPANT_NAME_MAX = 30;

/**
 * Validation error with a message safe to show the user (Principle VI —
 * never expose technical details). Distinct from an unexpected error/bug,
 * whose message must NOT be shown directly.
 */
export class ValidationError extends Error {}

/**
 * Strips HTML/script markup from text (constitution Principle VI).
 * Simple, safe strategy: discards characters that start tags or entities,
 * instead of trying a tag allowlist — there's no need for HTML in
 * room/participant names.
 */
function sanitize(rawText: string): string {
  return rawText.replace(/[<>&"'`]/g, "").trim();
}

export function validateRoomName(rawName: string): string {
  const name = sanitize(rawName);
  if (name.length < 1) {
    throw new ValidationError("Informe um nome para a sala.");
  }
  if (name.length > ROOM_NAME_MAX) {
    throw new ValidationError(`O nome da sala deve ter no máximo ${ROOM_NAME_MAX} caracteres.`);
  }
  return name;
}

export function validateParticipantName(rawName: string): string {
  const name = sanitize(rawName);
  if (name.length < 1) {
    throw new ValidationError("Informe seu nome.");
  }
  if (name.length > PARTICIPANT_NAME_MAX) {
    throw new ValidationError(
      `O nome deve ter no máximo ${PARTICIPANT_NAME_MAX} caracteres.`,
    );
  }
  return name;
}

export function namesEqualCaseInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
