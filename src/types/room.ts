export type PointScale = "fibonacci" | "sequential" | "tshirts";

export const POINT_SCALES: Record<PointScale, string[]> = {
  fibonacci: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"],
  sequential: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  tshirts: ["PP", "P", "M", "G", "GG"],
};

export const POINT_SCALE_LABELS: Record<PointScale, string> = {
  fibonacci: "Fibonacci modificado",
  sequential: "Sequencial (1–10)",
  tshirts: "Camisetas (PP–GG)",
};

export interface Participant {
  id: string;
  name: string;
  isModerator: boolean;
  joinedAt: number;
}

export type RoundState = "voting" | "revealed";

/**
 * Voting round of a room (feature 002). `votes` is a single object
 * accessible to all app code — vote secrecy (Principle II) is the
 * presentation layer's responsibility, which must never render
 * `votes[otherParticipantId]` before `state === 'revealed'` (see
 * data-model.md §Secrecy and research.md §5).
 */
export interface Round {
  state: RoundState;
  votes: Record<string, string>;
}

export interface Room {
  code: string;
  name: string;
  pointScale: PointScale;
  moderatorId: string;
  participants: Participant[];
  createdAt: number;
  lastActivityAt: number;
  round: Round;
}

export interface CreateRoomInput {
  roomName: string;
  creatorName: string;
  pointScale: PointScale;
}

/** Summary derived from the revealed round (data-model.md §Post-reveal summary). Not persisted. */
export type ResultSummary =
  | { type: "consensus"; value: string }
  | { type: "spread"; min: string; max: string }
  | { type: "no-consensus" };

export interface RoundSummary {
  votedCount: number;
  notVoted: Participant[];
  result: ResultSummary;
}

/** A group of participants who voted the same value (spec 004, data-model.md §ResultDistribution). */
export interface ValueGroup {
  value: string;
  participants: Participant[];
}

/**
 * Grouping of a revealed round's votes by distinct value — input for the
 * grouped result panel (spec 004, FR-007). Derived, not persisted — see
 * `groupByValue` in `roomStore.ts`.
 */
export interface ResultDistribution {
  groups: ValueGroup[];
  notVoted: Participant[];
}

export type RoomClientErrorCode =
  | "ROOM_NOT_FOUND"
  | "DUPLICATE_NAME"
  | "INVALID_INPUT"
  | "ROUND_ALREADY_REVEALED"
  | "INVALID_VALUE"
  | "MODERATOR_ONLY"
  | "NOT_AUTHORIZED";

export class RoomClientError extends Error {
  constructor(
    public readonly code: RoomClientErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RoomClientError";
  }
}
