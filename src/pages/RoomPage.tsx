import { useEffect } from "react";
import { useParams } from "react-router-dom";
import ConsensusBadge from "../components/ConsensusBadge/ConsensusBadge";
import HandOfCards from "../components/HandOfCards/HandOfCards";
import JoinRoomForm from "../components/JoinRoomForm/JoinRoomForm";
import RoundControls from "../components/RoundControls/RoundControls";
import SeatCard from "../components/SeatCard/SeatCard";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import { useJoinRoom } from "../hooks/useJoinRoom";
import { useModerator } from "../hooks/useModerator";
import { useRodada } from "../hooks/useRodada";
import { useRoom } from "../hooks/useRoom";
import { resumoRodada } from "../services/mock/roomStore";
import { roomClient } from "../services/roomClient";
import { ESCALAS_PONTOS, ESCALAS_PONTOS_LABEL } from "../types/room";
import styles from "./RoomPage.module.css";

export default function RoomPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { sala, carregando } = useRoom(codigo);
  const { identidade, salvarIdentidade } = useModerator(codigo);
  const { entrar, erro, carregando: entrando } = useJoinRoom(codigo ?? "");
  const { votar, revelar, resetar, erro: erroRodada } = useRodada(codigo, identidade?.participanteId);

  const souParticipante =
    !!identidade && !!sala?.participantes.some((p) => p.id === identidade.participanteId);

  // Sai da sala ao fechar a aba/navegar embora (US3).
  useEffect(() => {
    if (!codigo || !identidade) return;
    const handler = () => {
      roomClient.sairDaSala(codigo, identidade.participanteId);
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [codigo, identidade]);

  async function handleEntrar(nome: string) {
    const resultado = await entrar(nome);
    if (resultado) {
      salvarIdentidade({ participanteId: resultado.participanteId, ehModerador: false });
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
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.invite}
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            Convidar time
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.body}>
        {erroRodada && <p className={styles.erroRodada}>{erroRodada}</p>}

        {ehModerador && (
          <div className={styles.controlsSlot}>
            <RoundControls estado={sala.rodada.estado} onRevelar={revelar} onResetar={resetar} />
          </div>
        )}

        {resumo && (
          <div className={styles.resumoSlot}>
            <ConsensusBadge resumo={resumo} />
          </div>
        )}

        <h2 className={styles.sectionTitle}>Participantes</h2>
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

        <h2 className={styles.sectionTitle}>Suas cartas</h2>
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
