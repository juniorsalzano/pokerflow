import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GroupedResult from "../components/GroupedResult/GroupedResult";
import HandOfCards from "../components/HandOfCards/HandOfCards";
import JoinRoomForm from "../components/JoinRoomForm/JoinRoomForm";
import LoadingIcon from "../components/LoadingIcon/LoadingIcon";
import RoundControls from "../components/RoundControls/RoundControls";
import SeatCard from "../components/SeatCard/SeatCard";
import TablePanel from "../components/TablePanel/TablePanel";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import TopbarMenu from "../components/TopbarMenu/TopbarMenu";
import { useJoinRoom } from "../hooks/useJoinRoom";
import { clearIdentity, useModerator } from "../hooks/useModerator";
import { useLeaveRoom } from "../hooks/useLeaveRoom";
import { usePresence } from "../hooks/usePresence";
import { useRevealTransition } from "../hooks/useRevealTransition";
import { useRoom } from "../hooks/useRoom";
import { useRound } from "../hooks/useRound";
import { roomClient } from "../services/roomClient";
import { fireConfetti, shouldShowConfetti } from "../services/confetti";
import { getRoundSummary, groupByValue } from "../services/mock/roomStore";
import { POINT_SCALES, POINT_SCALE_LABELS } from "../types/room";
import styles from "./RoomPage.module.css";

type InviteStatus = "idle" | "copied" | "error";

/** Ícone do botão "Convidar time" — troca conforme o feedback do clique (link/check/erro). */
function InviteIcon({ status }: { status: InviteStatus }) {
  if (status === "copied") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, loading, closedError } = useRoom(code);
  const { identity, saveIdentity } = useModerator(code);
  const { join, error, loading: joining } = useJoinRoom(code ?? "");
  const { vote, reveal, reset, error: roundError } = useRound(code, identity?.participantId);
  const leaveRoom = useLeaveRoom(code, identity?.participantId);

  // Optimistic vote: the clicked card flips right away, without waiting for
  // the network round-trip — `vote` (useRound) already awaits the API call
  // before the real value shows up via `myVote`/polling, which made the
  // flip feel laggy. Cleared once that call settles (success or failure) —
  // from then on, `myVote` alone is the source of truth again. `pendingVoteRef`
  // guards against an earlier, slower call clearing a newer selection if the
  // user switches votes again before the first request comes back.
  const [optimisticVote, setOptimisticVote] = useState<string | undefined>(undefined);
  const pendingVoteRef = useRef<string | undefined>(undefined);

  async function handleVote(value: string) {
    pendingVoteRef.current = value;
    setOptimisticVote(value);
    await vote(value);
    if (pendingVoteRef.current === value) {
      setOptimisticVote(undefined);
    }
  }

  const isParticipant =
    !!identity && !!room?.participants.some((p) => p.id === identity.participantId);

  usePresence(code, isParticipant ? identity?.participantId : undefined);

  const { phase, countdownNumber } = useRevealTransition(
    room?.round.state,
    room?.participants.length ?? 0,
    room ? POINT_SCALES[room.pointScale].length : 0,
  );

  // Dispara o burst de confete no exato instante em que o painel de resultado
  // agrupado aparece, só em consenso total (spec 004, FR-008/FR-009). Depende
  // só de `phase` de propósito: dispara uma vez por entrada em "result", não
  // a cada nova leitura de `room` (polling/presença) enquanto a fase não muda.
  useEffect(() => {
    if (phase === "result" && room && shouldShowConfetti(getRoundSummary(room))) {
      fireConfetti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleLeave() {
    await leaveRoom();
    if (code) clearIdentity(code);
    navigate("/");
  }

  /** Moderator-only action (spec 005, US3) — simple confirmation before removing (FR-012). */
  async function handleRemoveParticipant(participantId: string, participantName: string) {
    if (!code) return;
    const confirmed = window.confirm(`Remover ${participantName} da sala?`);
    if (!confirmed) return;
    await roomClient.kickParticipant(code, participantId);
  }

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");
  const inviteTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(inviteTimeoutRef.current), []);

  async function handleInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setInviteStatus("copied");
    } catch {
      setInviteStatus("error");
    }
    clearTimeout(inviteTimeoutRef.current);
    inviteTimeoutRef.current = setTimeout(() => setInviteStatus("idle"), 2000);
  }

  async function handleJoin(name: string) {
    const result = await join(name);
    if (result) {
      saveIdentity({
        participantId: result.participantId,
        isModerator: false,
        token: result.token,
      });
    }
  }

  if (!code) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.centeredStage}>
        <p className={`${styles.message} ${styles.loadingMessage}`}>
          <LoadingIcon size={40} />
          Carregando sala…
        </p>
      </div>
    );
  }

  if (closedError?.code === "ROOM_CLOSED_BY_MODERATOR") {
    return (
      <div className={styles.centeredStage}>
        <div className={styles.messageCard}>
          <h1 className={styles.messageTitle}>Sala encerrada</h1>
          <p className={styles.message}>
            A sala foi encerrada porque o moderador saiu. Peça um novo link a quem
            organizou a sessão se quiser continuar.
          </p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={styles.centeredStage}>
        <div className={styles.messageCard}>
          <h1 className={styles.messageTitle}>Sala não encontrada</h1>
          <p className={styles.message}>
            Esse link não corresponde a nenhuma sala ativa no momento. Verifique o
            endereço ou peça um novo link para quem organizou a sessão.
          </p>
        </div>
      </div>
    );
  }

  // Identidade local existe (não é "nunca entrou"), mas sumiu da lista de
  // participantes da sala — foi removido pelo moderador (spec 005, FR-015).
  // Precisa vir antes do formulário de entrada abaixo, que também é
  // acionado quando `isParticipant` é falso, mas por um motivo diferente
  // (nunca ter entrado).
  const wasRemoved = !!identity && !room.participants.some((p) => p.id === identity.participantId);

  if (wasRemoved) {
    return (
      <div className={styles.centeredStage}>
        <div className={styles.messageCard}>
          <h1 className={styles.messageTitle}>Você foi removido da sala</h1>
          <p className={styles.message}>
            O moderador removeu você desta sala. Entre novamente pelo link se quiser
            voltar a participar.
          </p>
        </div>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className={styles.stage}>
        <div className={styles.toggleSlot}>
          <ThemeToggle />
        </div>
        <JoinRoomForm
          roomName={room.name}
          onSubmit={handleJoin}
          error={error}
          loading={joining}
        />
      </div>
    );
  }

  // Trava o voto assim que o moderador revela no servidor/mock (independente da
  // animação local) — HandOfCards usa esta variável, não `revealed` abaixo.
  const roundRevealed = room.round.state === "revealed";
  // Exibição visual (flip do SeatCard, resultado): só a partir de "flipping"
  // em diante, para não estragar o suspense da contagem regressiva (spec 004,
  // FR-004/FR-005) — as cartas continuam com a textura de verso até lá.
  const revealed =
    phase === "flipping" || phase === "leaving" || phase === "result" || phase === "returning";
  // O painel de resultado agrupado substitui "Suas cartas" (não a grade de
  // assentos, que fica sempre visível ao redor da mesa) — FR-006.
  const showResult = phase === "result";
  const isModerator = identity?.participantId === room.moderatorId;
  const myVote = identity ? room.round.votes[identity.participantId] : undefined;
  const resultDistribution = revealed ? groupByValue(room) : null;
  // Valor(es) mais votado(s) para destacar na mesa quando o resultado
  // aparece — a mesa ficava vazia nesse momento. Em caso de empate, mostra
  // TODOS os valores empatados (rótulo vira "Empate") em vez de escolher um
  // arbitrariamente — o painel abaixo já mostra a distribuição completa,
  // isso aqui é só um destaque, não a fonte da verdade.
  const maxVoteCount =
    resultDistribution && resultDistribution.groups.length > 0
      ? Math.max(...resultDistribution.groups.map((group) => group.participants.length))
      : undefined;
  const mostVotedValues =
    resultDistribution && maxVoteCount !== undefined
      ? resultDistribution.groups.filter((group) => group.participants.length === maxVoteCount).map((group) => group.value)
      : [];

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect
              x="18"
              y="12"
              width="28"
              height="40"
              rx="7"
              transform="rotate(7 32 32)"
              fill="var(--accent-a)"
            />
          </svg>
          <div className={styles.brandText}>
            <span className={styles.roomName}>{room.name}</span>
            <span className={styles.roomSub}>
              Escala: {POINT_SCALE_LABELS[room.pointScale]}
            </span>
          </div>
        </div>
        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.invite} ${inviteStatus === "copied" ? styles.inviteCopied : ""} ${
              inviteStatus === "error" ? styles.inviteError : ""
            }`}
            onClick={handleInvite}
            aria-live="polite"
          >
            <InviteIcon status={inviteStatus} />
            {inviteStatus === "copied"
              ? "Link copiado"
              : inviteStatus === "error"
                ? "Erro ao copiar"
                : "Convidar time"}
          </button>
          <TopbarMenu onLeave={handleLeave} />
        </div>
      </div>

      <div className={styles.body}>
        {roundError && <p className={styles.roundError}>{roundError}</p>}

        {isModerator && !showResult && (
          <div className={styles.controlsSlot}>
            <RoundControls state={room.round.state} onReveal={reveal} onReset={reset} />
          </div>
        )}

        <TablePanel
          phase={phase}
          countdownNumber={countdownNumber}
          mostVoted={
            mostVotedValues.length > 0 && maxVoteCount !== undefined
              ? { values: mostVotedValues, count: maxVoteCount, total: room.participants.length }
              : undefined
          }
        />

        <ul className={styles.seats} aria-label="Participantes da sala">
          {room.participants.map((p, index) => (
            <SeatCard
              key={p.id}
              participant={p}
              vote={p.id === identity?.participantId ? (optimisticVote ?? room.round.votes[p.id]) : room.round.votes[p.id]}
              revealed={revealed}
              isMe={p.id === identity?.participantId}
              index={index}
              onRemove={
                isModerator && p.id !== identity?.participantId
                  ? () => handleRemoveParticipant(p.id, p.name)
                  : undefined
              }
            />
          ))}
        </ul>

        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{showResult ? "Resultado" : "Suas cartas"}</h2>
        </div>
        {showResult ? (
          resultDistribution && (
            <GroupedResult
              distribution={resultDistribution}
              onReset={isModerator ? reset : undefined}
            />
          )
        ) : (
          <HandOfCards
            values={POINT_SCALES[room.pointScale]}
            selectedValue={optimisticVote ?? myVote}
            disabled={roundRevealed}
            onVote={handleVote}
            leaving={phase === "leaving"}
            entering={phase === "returning"}
          />
        )}
      </div>
    </div>
  );
}
