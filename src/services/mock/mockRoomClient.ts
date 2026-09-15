import { RoomClient } from "../roomClient";
import { CreateRoomInput, RoomClientError, Room } from "../../types/room";
import {
  addParticipant,
  createRoom as createRoomPure,
  isExpired,
  removeParticipant,
  reset as resetPure,
  reveal as revealPure,
  vote as votePure,
} from "./roomStore";

/**
 * Mocked RoomClient implementation: localStorage as the source of truth
 * across tabs + BroadcastChannel to notify already-open tabs almost
 * instantly (research.md §1). When the real API exists, an
 * http/httpRoomClient.ts implementation takes over this same contract.
 */

function storageKey(code: string): string {
  return `pokerflow:room:${code}`;
}

function readRawRoom(code: string): Room | null {
  const raw = localStorage.getItem(storageKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Room;
  } catch {
    return null;
  }
}

function saveRoom(room: Room): void {
  localStorage.setItem(storageKey(room.code), JSON.stringify(room));
  notifyLocal(room.code, room);
  getChannel(room.code).postMessage({ type: "changed" });
}

function deleteRoom(code: string): void {
  localStorage.removeItem(storageKey(code));
  notifyLocal(code, null);
}

// Local subscribers (within this same tab), keyed by room code.
const subscribersByCode = new Map<string, Set<(room: Room | null) => void>>();
const channelsByCode = new Map<string, BroadcastChannel>();

function notifyLocal(code: string, room: Room | null): void {
  subscribersByCode.get(code)?.forEach((cb) => cb(room));
}

/** No-op stub for environments without BroadcastChannel (e.g., some test runtimes). */
const nullChannel = { postMessage: () => {}, close: () => {}, onmessage: null } as unknown as BroadcastChannel;

function getChannel(code: string): BroadcastChannel {
  let channel = channelsByCode.get(code);
  if (!channel) {
    if (typeof BroadcastChannel === "undefined") {
      channel = nullChannel;
    } else {
      channel = new BroadcastChannel(storageKey(code));
      channel.onmessage = () => {
        notifyLocal(code, readCurrentRoom(code));
      };
    }
    channelsByCode.set(code, channel);
  }
  return channel;
}

/** Reads the room from localStorage, handling inactivity expiration (FR-008). */
function readCurrentRoom(code: string): Room | null {
  const room = readRawRoom(code);
  if (!room) return null;
  if (isExpired(room)) {
    deleteRoom(code);
    return null;
  }
  return room;
}

export const mockRoomClient: RoomClient = {
  async createRoom(input: CreateRoomInput) {
    const room = createRoomPure(input);
    saveRoom(room);
    return { code: room.code, room };
  },

  async joinRoom(code: string, participantName: string) {
    const room = readCurrentRoom(code);
    if (!room) {
      throw new RoomClientError("ROOM_NOT_FOUND", "Essa sala não existe ou expirou.");
    }
    const { room: updatedRoom, participant } = addParticipant(room, participantName);
    saveRoom(updatedRoom);
    return { participantId: participant.id, room: updatedRoom };
  },

  async getRoom(code: string) {
    return readCurrentRoom(code);
  },

  subscribeToRoom(code: string, callback: (room: Room | null) => void) {
    if (!subscribersByCode.has(code)) {
      subscribersByCode.set(code, new Set());
    }
    const subscribers = subscribersByCode.get(code)!;
    subscribers.add(callback);
    getChannel(code); // ensures the channel exists while there are subscribers

    // Notifies the current state immediately, so the subscriber doesn't wait
    // for the next change to get the initial data.
    callback(readCurrentRoom(code));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey(code)) {
        callback(readCurrentRoom(code));
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      subscribers.delete(callback);
      window.removeEventListener("storage", handleStorage);
      if (subscribers.size === 0) {
        channelsByCode.get(code)?.close();
        channelsByCode.delete(code);
        subscribersByCode.delete(code);
      }
    };
  },

  async leaveRoom(code: string, participantId: string) {
    const room = readCurrentRoom(code);
    if (!room) return; // already gone — nothing to do, idempotent operation
    const updatedRoom = removeParticipant(room, participantId);
    saveRoom(updatedRoom);
  },

  // No-op: the mock has no real server or connection timeout to detect —
  // the room only exists while the tab is open (localStorage), so there's no
  // "absence" to signal (research.md §14, feature 003).
  async sendHeartbeat() {},

  async vote(code: string, participantId: string, value: string) {
    const room = readCurrentRoom(code);
    if (!room) {
      throw new RoomClientError("ROOM_NOT_FOUND", "Essa sala não existe ou expirou.");
    }
    const updatedRoom = votePure(room, participantId, value);
    saveRoom(updatedRoom);
    return updatedRoom;
  },

  async reveal(code: string, participantId: string) {
    const room = readCurrentRoom(code);
    if (!room) {
      throw new RoomClientError("ROOM_NOT_FOUND", "Essa sala não existe ou expirou.");
    }
    const updatedRoom = revealPure(room, participantId);
    saveRoom(updatedRoom);
    return updatedRoom;
  },

  async reset(code: string, participantId: string) {
    const room = readCurrentRoom(code);
    if (!room) {
      throw new RoomClientError("ROOM_NOT_FOUND", "Essa sala não existe ou expirou.");
    }
    const updatedRoom = resetPure(room, participantId);
    saveRoom(updatedRoom);
    return updatedRoom;
  },
};
