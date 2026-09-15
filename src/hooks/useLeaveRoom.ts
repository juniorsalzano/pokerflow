import { useCallback } from "react";
import { roomClient } from "../services/roomClient";

/**
 * Explicit leave-room action (US3, spec 001) — best effort: if the call
 * fails (e.g., unstable network), it doesn't block leaving the screen; the
 * server removes the participant anyway via inactivity expiration (same
 * failure-tolerance pattern as `usePresence`).
 */
export function useLeaveRoom(code: string | undefined, participantId: string | undefined) {
  return useCallback(async () => {
    if (!code || !participantId) return;
    try {
      await roomClient.leaveRoom(code, participantId);
    } catch {
      // best effort — see comment above.
    }
  }, [code, participantId]);
}
