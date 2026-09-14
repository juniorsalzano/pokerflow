import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HandOfCards from "../components/HandOfCards/HandOfCards";
import JoinRoomForm from "../components/JoinRoomForm/JoinRoomForm";
import RoundControls from "../components/RoundControls/RoundControls";
import SeatCard from "../components/SeatCard/SeatCard";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import { useJoinRoom } from "../hooks/useJoinRoom";
import { limparIdentidade, useModerator } from "../hooks/useModerator";
import { usePresenca } from "../hooks/usePresenca";
import { useRodada } from "../hooks/useRodada";
import { useRoom } from "../hooks/useRoom";
import { useSairDaSala } from "../hooks/useSairDaSala";
import { resumoRodada } from "../services/mock/roomStore";
import { ESCALAS_PONTOS, ESCALAS_PONTOS_LABEL, ResumoRodada } from "../types/room";
import styles from "./RoomPage.module.css";

function textoResumo(resumo: ResumoRodada): string {
  const { resultado } = resumo;
  if (resultado.tipo === "consenso") {
    return `Consenso: ${resultado.valor}`;
  }
  if (resultado.tipo === "dispersao") {
    return `Dispersão ${resultado.min}–${resultado.max}`;
  }
  return "Sem consenso";
}

type StatusConvite = "idle" | "copiado" | "erro";

/** Ícone do botão "Convidar time" — troca conforme o feedback do clique (link/check/erro). */
function IconeConvite({ status }: { status: StatusConvite }) {
  if (status === "copiado") {
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
  if (status === "erro") {
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

/** Ícone de "sair da sala" (porta + seta) — usado num botão só de ícone na topbar. */
function IconeSair() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RoomPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { sala, carregando } = useRoom(codigo);
  const { identidade, salvarIdentidade } = useModerator(codigo);
  const { entrar, erro, carregando: entrando } = useJoinRoom(codigo ?? "");
  const { votar, revelar, resetar, erro: erroRodada } = useRodada(codigo, identidade?.participanteId);
  const sairDaSala = useSairDaSala(codigo, identidade?.participanteId);

  const souParticipante =
    !!identidade && !!sala?.participantes.some((p) => p.id === identidade.participanteId);

  usePresenca(codigo, souParticipante ? identidade?.participanteId : undefined);

  async function handleSair() {
    await sairDaSala();
    if (codigo) limparIdentidade(codigo);
    navigate("/");
  }

  const [statusConvite, setStatusConvite] = useState<StatusConvite>("idle");
  const timeoutConviteRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutConviteRef.current), []);

  async function handleConvidar() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusConvite("copiado");
    } catch {
      setStatusConvite("erro");
    }
    clearTimeout(timeoutConviteRef.current);
    timeoutConviteRef.current = setTimeout(() => setStatusConvite("idle"), 2000);
  }

  async function handleEntrar(nome: string) {
    const resultado = await entrar(nome);
    if (resultado) {
      salvarIdentidade({
        participanteId: resultado.participanteId,
        ehModerador: false,
        token: resultado.token,
      });
    }
  }

  if (!codigo) {
    return null;
  }

  if (carregando) {
    return (
      <div className={styles.stageCentralizado}>
        <p className={styles.mensagem}>Carregando sala…</p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className={styles.stageCentralizado}>
        <div className={styles.cardMensagem}>
          <h1 className={styles.tituloMensagem}>Sala não encontrada</h1>
          <p className={styles.mensagem}>
            Esse link não corresponde a nenhuma sala ativa no momento. Verifique o
            endereço ou peça um novo link para quem organizou a sessão.
          </p>
        </div>
      </div>
    );
  }

  if (!souParticipante) {
    return (
      <div className={styles.stage}>
        <div className={styles.toggleSlot}>
          <ThemeToggle />
        </div>
        <JoinRoomForm
          nomeSala={sala.nome}
          onSubmit={handleEntrar}
          erro={erro}
          carregando={entrando}
        />
      </div>
    );
  }

  const revelado = sala.rodada.estado === "revelada";
  const ehModerador = identidade?.participanteId === sala.moderadorId;
  const meuVoto = identidade ? sala.rodada.votos[identidade.participanteId] : undefined;
  const resumo = revelado ? resumoRodada(sala) : null;

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
            <span className={styles.roomName}>{sala.nome}</span>
            <span className={styles.roomSub}>
              Escala: {ESCALAS_PONTOS_LABEL[sala.escalaPontos]}
            </span>
          </div>
        </div>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          {revelado ? "Revelado" : "Votação em andamento"}
          {resumo && <span className={styles.statusResumo}>· {textoResumo(resumo)}</span>}
        </div>
        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.invite} ${statusConvite === "copiado" ? styles.inviteCopiado : ""} ${
              statusConvite === "erro" ? styles.inviteErro : ""
            }`}
            onClick={handleConvidar}
            aria-live="polite"
          >
            <IconeConvite status={statusConvite} />
            {statusConvite === "copiado"
              ? "Link copiado"
              : statusConvite === "erro"
                ? "Erro ao copiar"
                : "Convidar time"}
          </button>
          <ThemeToggle />
          <button
            type="button"
            className={styles.sair}
            onClick={handleSair}
            title="Sair da sala"
            aria-label="Sair da sala"
          >
            <IconeSair />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {erroRodada && <p className={styles.erroRodada}>{erroRodada}</p>}

        {ehModerador && (
          <div className={styles.controlsSlot}>
            <RoundControls estado={sala.rodada.estado} onRevelar={revelar} onResetar={resetar} />
          </div>
        )}

        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Participantes</h2>
          <span className={styles.sectionCount}>{sala.participantes.length}</span>
        </div>
        <ul className={styles.assentos} aria-label="Participantes da sala">
          {sala.participantes.map((p, indice) => (
            <SeatCard
              key={p.id}
              participante={p}
              voto={sala.rodada.votos[p.id]}
              revelado={revelado}
              souEu={p.id === identidade?.participanteId}
              indice={indice}
            />
          ))}
        </ul>

        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Suas cartas</h2>
        </div>
        <HandOfCards
          valores={ESCALAS_PONTOS[sala.escalaPontos]}
          valorSelecionado={meuVoto}
          desabilitado={revelado}
          onVotar={votar}
        />
      </div>
    </div>
  );
}
