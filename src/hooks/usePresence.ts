import { useEffect } from "react";
import { roomClient } from "../services/roomClient";

const PRESENCE_INTERVAL_MS = 45_000;

/**
 * Periodic presence signal (FR-010) while the room is open — replaces the
 * old automatic leave on `beforeunload`, which contradicted US3 (reconnect
 * without losing identity). An isolated failure (network, 401) is silently
 * ignored here: only repeated absence for 10 straight minutes (server-side,
 * FR-011) removes someone from the room — a single missed heartbeat
 * shouldn't drop the user's session.
 */
export function usePresence(code: string | undefined, participantId: string | undefined): void {
  useEffect(() => {
    if (!code || !participantId) return;

    const interval = setInterval(() => {
      roomClient.sendHeartbeat(code, participantId).catch(() => {});
    }, PRESENCE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [code, participantId]);
}
