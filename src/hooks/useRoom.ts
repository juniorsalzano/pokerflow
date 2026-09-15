import { useEffect, useState } from "react";
import { roomClient } from "../services/roomClient";
import { Room } from "../types/room";

/**
 * Keeps the room updated in real time (SC-004: within a few seconds),
 * subscribing to roomClient.subscribeToRoom. `loading` is true only until
 * the first read resolves; after that, `room === null` means "not found".
 */
export function useRoom(code: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = roomClient.subscribeToRoom(code, (currentRoom) => {
      setRoom(currentRoom);
      setLoading(false);
    });
    return unsubscribe;
  }, [code]);

  return { room, loading };
}
