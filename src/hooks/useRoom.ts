import { useEffect, useState } from "react";
import { roomClient } from "../services/roomClient";
import { Room, RoomClientError } from "../types/room";

/**
 * Keeps the room updated in real time (SC-004: within a few seconds),
 * subscribing to roomClient.subscribeToRoom. `loading` is true only until
 * the first read resolves; after that, `room === null` means "not found".
 * `closedError` is only ever set for `ROOM_CLOSED_BY_MODERATOR` (spec 005,
 * FR-005) — a dedicated reason distinct from "not found/expired".
 */
export function useRoom(code: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [closedError, setClosedError] = useState<RoomClientError | undefined>(undefined);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setClosedError(undefined);
    const unsubscribe = roomClient.subscribeToRoom(code, (currentRoom, error) => {
      setRoom(currentRoom);
      setClosedError(error);
      setLoading(false);
    });
    return unsubscribe;
  }, [code]);

  return { room, loading, closedError };
}
