import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RoomPage from "../../src/pages/RoomPage";
import { saveIdentity } from "../../src/hooks/useModerator";
import { RoomClientError, Room } from "../../src/types/room";

const CODE = "abc1234";

type SubscribeCallback = (room: Room | null, error?: RoomClientError) => void;
let latestSubscribeCallback: SubscribeCallback | undefined;

vi.mock("../../src/services/roomClient", () => ({
  roomClient: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    getRoom: vi.fn(),
    subscribeToRoom: vi.fn((_code: string, callback: SubscribeCallback) => {
      latestSubscribeCallback = callback;
      return () => {};
    }),
    leaveRoom: vi.fn().mockResolvedValue(undefined),
    kickParticipant: vi.fn().mockResolvedValue(undefined),
    sendHeartbeat: vi.fn().mockResolvedValue(undefined),
    vote: vi.fn(),
    reveal: vi.fn(),
    reset: vi.fn(),
  },
}));

function renderRoomPage() {
  return render(
    <MemoryRouter initialEntries={[`/room/${CODE}`]}>
      <Routes>
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  latestSubscribeCallback = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function baseRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: CODE,
    name: "Sala Teste",
    pointScale: "fibonacci",
    moderatorId: "mod1",
    participants: [{ id: "mod1", name: "Ana", isModerator: true, joinedAt: 1 }],
    createdAt: 1,
    lastActivityAt: 1,
    round: { state: "voting", votes: {} },
    ...overrides,
  };
}

describe("RoomPage — sala encerrada pelo moderador (spec 005, US1, FR-005)", () => {
  it("mostra uma mensagem específica de sala encerrada, distinta de 'sala não encontrada'", () => {
    saveIdentity(CODE, { participantId: "p1", isModerator: false, token: "token-p1" });
    renderRoomPage();

    act(() => {
      latestSubscribeCallback?.(null, new RoomClientError("ROOM_CLOSED_BY_MODERATOR", "A sala foi encerrada porque o moderador saiu."));
    });

    expect(screen.getByText("Sala encerrada")).toBeInTheDocument();
    expect(screen.queryByText("Sala não encontrada")).not.toBeInTheDocument();
  });
});

describe("RoomPage — participante removido pelo moderador (spec 005, US3, FR-015)", () => {
  it("mostra uma mensagem específica de removido quando a própria identidade some da lista, com a sala ainda existindo", () => {
    saveIdentity(CODE, { participantId: "p-removido", isModerator: false, token: "token-removido" });
    renderRoomPage();

    // Sala existe e responde normalmente, mas sem "p-removido" na lista.
    act(() => {
      latestSubscribeCallback?.(baseRoom());
    });

    expect(screen.getByText("Você foi removido da sala")).toBeInTheDocument();
  });

  it("não confunde 'removido' com 'nunca entrou' — sem identidade local, mostra o formulário de entrada", () => {
    renderRoomPage();

    act(() => {
      latestSubscribeCallback?.(baseRoom());
    });

    expect(screen.queryByText("Você foi removido da sala")).not.toBeInTheDocument();
    expect(screen.getByText("Entrar na sala")).toBeInTheDocument();
  });

  it("participante que continua na lista não vê a mensagem de removido", () => {
    saveIdentity(CODE, { participantId: "mod1", isModerator: true, token: "token-mod1" });
    renderRoomPage();

    act(() => {
      latestSubscribeCallback?.(baseRoom());
    });

    expect(screen.queryByText("Você foi removido da sala")).not.toBeInTheDocument();
  });
});
