import { Participant } from "../../types/room";
import styles from "./ParticipantList.module.css";

interface ParticipantListProps {
  participants: Participant[];
  yourId?: string;
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

const COLORS = ["#8B5CF6", "#38BDF8", "#FB7185", "#2DD4BF", "#F472B6", "#FBBF24"];

function colorFor(participantId: string): string {
  let sum = 0;
  for (let i = 0; i < participantId.length; i++) sum += participantId.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

export default function ParticipantList({ participants, yourId }: ParticipantListProps) {
  return (
    <ul className={styles.list} aria-label="Participantes da sala">
      {participants.map((p) => (
        <li key={p.id} className={styles.item}>
          <span className={styles.avatar} style={{ background: colorFor(p.id) }}>
            {initials(p.name)}
          </span>
          <span className={styles.name}>
            {p.name}
            {p.id === yourId && " (você)"}
          </span>
          {p.isModerator && <span className={styles.moderatorBadge}>Moderador(a)</span>}
        </li>
      ))}
    </ul>
  );
}
