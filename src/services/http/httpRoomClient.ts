import { RoomClient } from "../roomClient";
import { readIdentity } from "../../hooks/useModerator";
import { CreateRoomInput, RoomClientErrorCode, RoomClientError, Room } from "../../types/room";

const POLLING_INTERVAL_MS = 2000;
/** Placeholder for another participant's vote not yet revealed — never the real value (finding D1). */
const HIDDEN_VOTE_PLACEHOLDER = "•";

function baseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

interface RedactedRound {
  state: "voting" | "revealed";
  voters: string[];
  myVote?: string;
  votes?: Record<string, string>;
}

interface RedactedRoom extends Omit<Room, "round"> {
  round: RedactedRound;
}

interface ErrorBody {
  code?: RoomClientErrorCode;
  message?: string;
}

/**
 * Calls the real API. Business errors (recognized `{code, message}` body)
 * become `RoomClientError`. Any other failure (network unavailable, timeout,
 * 5xx without a JSON body) propagates as a plain error — never becomes a
 * `RoomClientError` (finding E1, `research.md` §11): the existing hooks
 * (`useRound`, `useJoinRoom`, `useCreateRoom`) already show a generic "try
 * again" message for any error that isn't a `RoomClientError`.
 */
async function callApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    let body: ErrorBody | undefined;
    try {
      body = (await response.json()) as ErrorBody;
    } catch {
      body = undefined;
    }
    if (body?.code && body?.message) {
      throw new RoomClientError(body.code, body.message);
    }
    throw new Error(`Falha na requisição (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/**
 * Rebuilds the internal `Round.votes` (shape the components already
 * expect) from the server's redacted payload (contracts/api-contract.md).
 * Another participant's real value never reaches this point before the
 * reveal — `HIDDEN_VOTE_PLACEHOLDER` only exists so `vote !== undefined`
 * keeps triggering the "already voted" state in `SeatCard`.
 */
function rebuildRoom(raw: RedactedRoom, myId: string | undefined): Room {
  const votes: Record<string, string> = {};

  if (raw.round.state === "revealed" && raw.round.votes) {
    Object.assign(votes, raw.round.votes);
  } else {
    for (const id of raw.round.voters) {
      votes[id] = id === myId && raw.round.myVote !== undefined ? raw.round.myVote : HIDDEN_VOTE_PLACEHOLDER;
    }
  }

  return { ...raw, round: { state: raw.round.state, votes } };
}

function currentIdentity(code: string): { participantId: string; token: string } | undefined {
  const identity = readIdentity(code);
  if (!identity?.token) return undefined;
  return { participantId: identity.participantId, token: identity.token };
}

async function fetchRoom(code: string): Promise<Room | null> {
  const requester = currentIdentity(code);
  const query = requester
    ? `?participantId=${encodeURIComponent(requester.participantId)}&token=${encodeURIComponent(requester.token)}`
    : "";

  try {
    const raw = await callApi<RedactedRoom>(`/rooms/${code}${query}`);
    return rebuildRoom(raw, requester?.participantId);
  } catch (e) {
    if (e instanceof RoomClientError && e.code === "ROOM_NOT_FOUND") {
      return null;
    }
    throw e;
  }
}

// Local subscribers (within this same tab) by room code — same pattern as
// mockRoomClient. Exists so `vote`/`reveal`/`reset` can notify the screen
// itself right away (see `notifySubscribers`), instead of depending on the
// next polling tick (up to POLLING_INTERVAL_MS of perceptible delay on the
// "effect" of the action itself).
const subscribersByCode = new Map<string, Set<(room: Room | null) => void>>();
const lastPayloadByCode = new Map<string, string | null>();

function notifySubscribers(code: string, room: Room | null): void {
  const payload = JSON.stringify(room);
  if (payload === lastPayloadByCode.get(code)) return;
  lastPayloadByCode.set(code, payload);
  subscribersByCode.get(code)?.forEach((cb) => cb(room));
}

export const httpRoomClient: RoomClient = {
  async createRoom(input: CreateRoomInput) {
    const response = await callApi<{ code: string; participantId: string; token: string; room: RedactedRoom }>(
      "/rooms",
      { method: "POST", body: JSON.stringify(input) },
    );
    return {
      code: response.code,
      room: rebuildRoom(response.room, response.participantId),
      token: response.token,
    };
  },

  async joinRoom(code: string, participantName: string) {
    const response = await callApi<{ participantId: string; token: string; room: RedactedRoom }>(
      `/rooms/${code}/participants`,
      { method: "POST", body: JSON.stringify({ participantName }) },
    );
    return {
      participantId: response.participantId,
      room: rebuildRoom(response.room, response.participantId),
      token: response.token,
    };
  },

  async getRoom(code: string) {
    return fetchRoom(code);
  },

  subscribeToRoom(code: string, callback: (room: Room | null) => void) {
    if (!subscribersByCode.has(code)) {
      subscribersByCode.set(code, new Set());
    }
    const subscribers = subscribersByCode.get(code)!;
    subscribers.add(callback);

    async function poll() {
      const room = await fetchRoom(code).catch(() => undefined);
      // If the subscription was already canceled (or a more recent call
      // already notified), the `Set` no longer contains this `callback` —
      // but the notification always goes to every current subscriber of the
      // code, not just whoever triggered `poll`, so this is safe even with
      // delayed responses arriving out of order.
      if (room === undefined) return;
      notifySubscribers(code, room);
    }

    void poll();
    const interval = setInterval(poll, POLLING_INTERVAL_MS);

    return () => {
      subscribers.delete(callback);
      clearInterval(interval);
      if (subscribers.size === 0) {
        subscribersByCode.delete(code);
        lastPayloadByCode.delete(code);
      }
    };
  },

  async leaveRoom(code: string, participantId: string) {
    const identity = currentIdentity(code);
    const query = identity?.token ? `?token=${encodeURIComponent(identity.token)}` : "";
    // `keepalive` prevents the browser from aborting this call when it's
    // fired during page unload (e.g., a future leave button called near a
    // beforeunload/navigation).
    await callApi<void>(`/rooms/${code}/participants/${participantId}${query}`, {
      method: "DELETE",
      keepalive: true,
    });
  },

  async sendHeartbeat(code: string, participantId: string) {
    const token = currentIdentity(code)?.token ?? "";
    await callApi<void>(`/rooms/${code}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ participantId, token }),
    });
  },

  async vote(code: string, participantId: string, value: string) {
    const token = currentIdentity(code)?.token ?? "";
    const raw = await callApi<RedactedRoom>(`/rooms/${code}/votes`, {
      method: "POST",
      body: JSON.stringify({ participantId, token, value }),
    });
    const room = rebuildRoom(raw, participantId);
    notifySubscribers(code, room);
    return room;
  },

  async reveal(code: string, participantId: string) {
    const token = currentIdentity(code)?.token ?? "";
    const raw = await callApi<RedactedRoom>(`/rooms/${code}/reveal`, {
      method: "POST",
      body: JSON.stringify({ participantId, token }),
    });
    const room = rebuildRoom(raw, participantId);
    notifySubscribers(code, room);
    return room;
  },

  async reset(code: string, participantId: string) {
    const token = currentIdentity(code)?.token ?? "";
    const raw = await callApi<RedactedRoom>(`/rooms/${code}/reset`, {
      method: "POST",
      body: JSON.stringify({ participantId, token }),
    });
    const room = rebuildRoom(raw, participantId);
    notifySubscribers(code, room);
    return room;
  },
};
