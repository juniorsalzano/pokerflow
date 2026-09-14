import { useEffect } from "react";
import { useParams } from "react-router-dom";
import JoinRoomForm from "../components/JoinRoomForm/JoinRoomForm";
import ParticipantList from "../components/ParticipantList/ParticipantList";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import { useJoinRoom } from "../hooks/useJoinRoom";
import { useModerator } from "../hooks/useModerator";
import { useRoom } from "../hooks/useRoom";
import { roomClient } from "../services/roomClient";
import { ESCALAS_PONTOS_LABEL } from "../types/room";
import styles from "./RoomPage.module.css";

export default function RoomPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { sala, carregando } = useRoom(codigo);
  const { identidade, salvarIdentidade } = useModerator(codigo);
  const { entrar, erro, carregando: entrando } = useJoinRoom(codigo ?? "");

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
        <h2 className={styles.sectionTitle}>Participantes</h2>
        <ParticipantList
          participantes={sala.participantes}
          vocesId={identidade?.participanteId}
        />
        <p className={styles.aviso}>
          A rodada de votação chega em uma próxima atualização — por enquanto, quem
          entra na sala já aparece aqui para todos, em tempo real.
        </p>
      </div>
    </div>
  );
}
