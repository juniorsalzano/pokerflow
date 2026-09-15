import { useEffect, useState } from "react";

export interface Identity {
  participantId: string;
  isModerator: boolean;
  /** Secret credential (finding D1, feature 003) — only exists with the real backend; absent in the mock phase. */
  token?: string;
}

function storageKey(code: string): string {
  return `pokerflow:me:${code}`;
}

/**
 * Persists who this browser's user is within a room (FR-010).
 *
 * Uses localStorage (not sessionStorage): the identity needs to survive
 * closing the tab and reopening it via the room link later, not just an F5.
 * An earlier version used sessionStorage to prevent a second tab in the
 * same browser from being recognized as the same participant — but against
 * the real backend this made reopening the room turn into a genuinely new
 * participant every time. Accepted trade-off: two tabs of the same room in
 * the same browser now count as the same person (which is correct — they
 * are the same person).
 */
export function saveIdentity(code: string, identity: Identity): void {
  localStorage.setItem(storageKey(code), JSON.stringify(identity));
}

export function readIdentity(code: string): Identity | null {
  const raw = localStorage.getItem(storageKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

/** Clears the local identity when deliberately leaving the room (US3) — whoever reopens the link afterward joins as a new participant. */
export function clearIdentity(code: string): void {
  localStorage.removeItem(storageKey(code));
}

/**
 * Hook exposing the user's local identity for a room — survives
 * closing/reopening the tab because it reads from localStorage (FR-010),
 * without requiring a new login.
 */
export function useModerator(code: string | undefined) {
  const [identity, setIdentity] = useState<Identity | null>(() =>
    code ? readIdentity(code) : null,
  );

  useEffect(() => {
    if (code) {
      setIdentity(readIdentity(code));
    }
  }, [code]);

  return {
    identity,
    isModerator: identity?.isModerator ?? false,
    saveIdentity: (next: Identity) => {
      if (!code) return;
      saveIdentity(code, next);
      setIdentity(next);
    },
  };
}
