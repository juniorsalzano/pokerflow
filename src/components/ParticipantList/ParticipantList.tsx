import { Participante } from "../../types/room";
import styles from "./ParticipantList.module.css";

interface ParticipantListProps {
  participantes: Participante[];
  vocesId?: string;
}

function iniciais(nome: string): string {
  return nome.trim().slice(0, 2).toUpperCase();
}

const CORES = ["#8B5CF6", "#38BDF8", "#FB7185", "#2DD4BF", "#F472B6", "#FBBF24"];

function corPara(participanteId: string): string {
  let soma = 0;
  for (let i = 0; i < participanteId.length; i++) soma += participanteId.charCodeAt(i);
  return CORES[soma % CORES.length];
}

export default function ParticipantList({ participantes, vocesId }: ParticipantListProps) {
  return (
    <ul className={styles.lista} aria-label="Participantes da sala">
      {participantes.map((p) => (
        <li key={p.id} className={styles.item}>
          <span className={styles.avatar} style={{ background: corPara(p.id) }}>
            {iniciais(p.nome)}
          </span>
          <span className={styles.nome}>
            {p.nome}
            {p.id === vocesId && " (você)"}
          </span>
          {p.ehModerador && <span className={styles.badgeModerador}>Moderador(a)</span>}
        </li>
      ))}
    </ul>
  );
}
