import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomClient } from "../services/roomClient";
import { ValidationError } from "../services/mock/validation";
import { CreateRoomInput, RoomClientError } from "../types/room";
import { saveIdentity } from "./useModerator";

export function useCreateRoom() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createRoom = useCallback(
    async (input: CreateRoomInput) => {
      setError(null);
      setLoading(true);
      try {
        const { code, room, token } = await roomClient.createRoom(input);
        saveIdentity(code, { participantId: room.moderatorId, isModerator: true, token });
        navigate(`/room/${code}`);
      } catch (e) {
        // Only show the message for known errors we've already thought
        // through for the user; any other unexpected error uses a generic
        // message, to never leak technical details (Principle VI).
        // ValidationError (mock) and RoomClientError "INVALID_INPUT" (real
        // backend) are the same business case through both paths (found
        // while implementing feature 003 — preserves SC-003, behavior
        // parity).
        setError(
          e instanceof ValidationError || e instanceof RoomClientError
            ? e.message
            : "Não foi possível criar a sala. Tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  return { createRoom, error, loading };
}
