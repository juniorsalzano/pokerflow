import { CreateRoomInput, Participant, Room, RoomClientError } from "../types/room";

/**
 * Single boundary between the UI and the data source (contracts/api-contract.md).
 * Today implemented by mock/mockRoomClient.ts; when the real API exists, an
 * http/httpRoomClient.ts implementation follows this exact contract.
 */
export interface RoomClient {
  createRoom(input: CreateRoomInput): Promise<{ code: string; room: Room; token?: string }>;

  joinRoom(
    code: string,
    participantName: string,
  ): Promise<{ participantId: string; room: Room; token?: string }>;

  getRoom(code: string): Promise<Room | null>;

  /**
   * `error` is only ever set when `room` is closed specifically because the
   * moderator left/went absent (spec 005, `ROOM_CLOSED_BY_MODERATOR`) — lets
   * the UI show a dedicated message instead of the generic "not found",
   * without changing the meaning of `room === null` anywhere else.
   */
  subscribeToRoom(code: string, callback: (room: Room | null, error?: RoomClientError) => void): () => void;

  leaveRoom(code: string, participantId: string): Promise<void>;

  /** Moderator-only: removes another participant from the room (spec 005, FR-009/FR-010). */
  kickParticipant(code: string, targetParticipantId: string): Promise<void>;

  /** Periodic presence signal (FR-010) — keeps the participant active in the room. No-op in the mock (research.md §14, feature 003). */
  sendHeartbeat(code: string, participantId: string): Promise<void>;

  vote(code: string, participantId: string, value: string): Promise<Room>;

  reveal(code: string, participantId: string): Promise<Room>;

  reset(code: string, participantId: string): Promise<Room>;
}

export type { Participant, Room };

// Single wiring point: uses the real API (http/httpRoomClient.ts) when
// VITE_API_BASE_URL is defined; otherwise falls back to the mock — no
// component changes in either case (feature 003).
import { mockRoomClient } from "./mock/mockRoomClient";
import { httpRoomClient } from "./http/httpRoomClient";

export const roomClient: RoomClient = import.meta.env.VITE_API_BASE_URL ? httpRoomClient : mockRoomClient;
