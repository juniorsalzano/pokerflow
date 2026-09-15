import { generateRoomCode } from "./generateRoomCode";
import { namesEqualCaseInsensitive, validateParticipantName, validateRoomName } from "./validation";
import {
  CreateRoomInput,
  POINT_SCALES,
  Participant,
  ResultDistribution,
  RoomClientError,
  Room,
  RoundSummary,
} from "../../types/room";

/** Inactivity limit after which a room is treated as expired (FR-008, research.md §5). */
export const INACTIVITY_LIMIT_MS = 4 * 60 * 60 * 1000;

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Pure room-creation logic (FR-001/FR-002/FR-002a/FR-002b/FR-005).
 * No I/O — the caller decides where to persist the result.
 */
export function createRoom(input: CreateRoomInput, now: number = Date.now()): Room {
  const roomName = validateRoomName(input.roomName);
  const creatorName = validateParticipantName(input.creatorName);

  const moderator: Participant = {
    id: newId(),
    name: creatorName,
    isModerator: true,
    joinedAt: now,
  };

  return {
    code: generateRoomCode(),
    name: roomName,
    pointScale: input.pointScale,
    moderatorId: moderator.id,
    participants: [moderator],
    createdAt: now,
    lastActivityAt: now,
    round: { state: "voting", votes: {} },
  };
}

/**
 * Checks whether a room should be treated as expired due to inactivity
 * (FR-008). Needed because the mock persists to localStorage, which doesn't
 * expire on its own (see research.md §5).
 */
export function isExpired(room: Room, now: number = Date.now()): boolean {
  return now - room.lastActivityAt > INACTIVITY_LIMIT_MS;
}

/**
 * Adds a participant to the room (FR-003/FR-006). Throws RoomClientError
 * "DUPLICATE_NAME" if someone active with the same name (case-insensitive)
 * already exists in the room.
 */
export function addParticipant(
  room: Room,
  rawName: string,
  now: number = Date.now(),
): { room: Room; participant: Participant } {
  const name = validateParticipantName(rawName);

  const alreadyExists = room.participants.some((p) => namesEqualCaseInsensitive(p.name, name));
  if (alreadyExists) {
    throw new RoomClientError(
      "DUPLICATE_NAME",
      "Já existe alguém nessa sala com esse nome. Escolha outro.",
    );
  }

  const participant: Participant = {
    id: newId(),
    name,
    isModerator: false,
    joinedAt: now,
  };

  const updatedRoom: Room = {
    ...room,
    participants: [...room.participants, participant],
    lastActivityAt: now,
  };

  return { room: updatedRoom, participant };
}

/** Removes a participant from the room (US3 — leave/disconnect). */
export function removeParticipant(
  room: Room,
  participantId: string,
  now: number = Date.now(),
): Room {
  return {
    ...room,
    participants: room.participants.filter((p) => p.id !== participantId),
    lastActivityAt: now,
  };
}

/**
 * Registers or replaces a participant's vote in the current round
 * (FR-002/FR-005). Throws `ROUND_ALREADY_REVEALED` if the round was already
 * revealed (FR-009 — votes locked after the reveal) and `INVALID_VALUE` if
 * the value doesn't belong to the room's point scale.
 */
export function vote(
  room: Room,
  participantId: string,
  value: string,
  now: number = Date.now(),
): Room {
  if (room.round.state !== "voting") {
    throw new RoomClientError(
      "ROUND_ALREADY_REVEALED",
      "Os votos desta rodada já foram revelados. Aguarde o próximo reset para votar.",
    );
  }
  if (!POINT_SCALES[room.pointScale].includes(value)) {
    throw new RoomClientError("INVALID_VALUE", "Esse valor não faz parte da escala desta sala.");
  }

  return {
    ...room,
    round: {
      ...room.round,
      votes: { ...room.round.votes, [participantId]: value },
    },
    lastActivityAt: now,
  };
}

/**
 * Reveals the current round's votes (FR-006/FR-007), moderator-only.
 * Throws `MODERATOR_ONLY` if the caller isn't the room owner.
 */
export function reveal(room: Room, participantId: string, now: number = Date.now()): Room {
  if (participantId !== room.moderatorId) {
    throw new RoomClientError("MODERATOR_ONLY", "Apenas o moderador da sala pode revelar os votos.");
  }

  return {
    ...room,
    round: { ...room.round, state: "revealed" },
    lastActivityAt: now,
  };
}

/**
 * Clears the current round's votes and returns to hidden voting state
 * (FR-010/FR-011/FR-012), moderator-only. Accepted regardless of the
 * round's current state (idempotent with respect to `state`).
 */
export function reset(room: Room, participantId: string, now: number = Date.now()): Room {
  if (participantId !== room.moderatorId) {
    throw new RoomClientError("MODERATOR_ONLY", "Apenas o moderador da sala pode resetar a rodada.");
  }

  return {
    ...room,
    round: { state: "voting", votes: {} },
    lastActivityAt: now,
  };
}

/** True if `value` is a numeric scale value (excludes "?" and "☕"). */
function isNumericValue(value: string): boolean {
  return value.trim() !== "" && !Number.isNaN(Number(value));
}

/**
 * Summary derived from the current round (data-model.md §Post-reveal
 * summary), computed on demand — never persisted. Iterates over
 * `room.participants` (the current list), never over
 * `Object.keys(round.votes)` directly: the vote of someone who already left
 * the room must no longer count in any result (spec Edge Case).
 */
export function getRoundSummary(room: Room): RoundSummary {
  const { votes } = room.round;

  const notVoted = room.participants.filter((p) => !(p.id in votes));
  const currentVotes = room.participants.filter((p) => p.id in votes).map((p) => votes[p.id]);
  const votedCount = currentVotes.length;

  if (votedCount === 0) {
    return { votedCount, notVoted, result: { type: "no-consensus" } };
  }

  const allIdentical = currentVotes.every((v) => v === currentVotes[0]);
  if (allIdentical) {
    return { votedCount, notVoted, result: { type: "consensus", value: currentVotes[0] } };
  }

  const numericScale = room.pointScale === "fibonacci" || room.pointScale === "sequential";
  if (numericScale && currentVotes.every(isNumericValue)) {
    const sorted = [...currentVotes].sort((a, b) => Number(a) - Number(b));
    return {
      votedCount,
      notVoted,
      result: { type: "spread", min: sorted[0], max: sorted[sorted.length - 1] },
    };
  }

  return { votedCount, notVoted, result: { type: "no-consensus" } };
}

/**
 * Groups the participants of a revealed round by voted value (spec 004,
 * FR-007/FR-011/FR-012) — input for the grouped result panel. Same data
 * source as `getRoundSummary` (iterates `room.participants`, never
 * `Object.keys(round.votes)` directly, for the same reason: the vote of
 * someone who already left the room must not count). Doesn't create empty
 * groups — if nobody voted, `groups` is `[]` (FR-011, empty state handled
 * by the UI).
 */
export function groupByValue(room: Room): ResultDistribution {
  const { votes } = room.round;

  const notVoted = room.participants.filter((p) => !(p.id in votes));
  const voted = room.participants.filter((p) => p.id in votes);

  const participantsByValue = new Map<string, Participant[]>();
  for (const participant of voted) {
    const value = votes[participant.id];
    const group = participantsByValue.get(value);
    if (group) {
      group.push(participant);
    } else {
      participantsByValue.set(value, [participant]);
    }
  }

  const groups = Array.from(participantsByValue, ([value, participants]) => ({
    value,
    participants,
  }));

  return { groups, notVoted };
}
