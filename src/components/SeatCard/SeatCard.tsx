import { Participante } from "../../types/room";
import ValorCarta from "../ValorCarta/ValorCarta";
import styles from "./SeatCard.module.css";

interface SeatCardProps {
  participante: Participante;
  /** Valor votado por este participante, se houver — undefined = ainda não votou. */
  voto?: string;
  /** true quando o moderador já revelou a rodada atual. */
  revelado: boolean;
  /** true quando este assento representa o próprio usuário desta aba (FR-004a). */
  souEu: boolean;
  /** índice na lista, usado para escalonar a animação de virar no reveal (research.md §1). */
  indice?: number;
}

/**
 * Cartinha de status por participante. Estados possíveis:
 * - vazio: participante ainda não votou.
 * - oculto (verso): participante já votou, mas o valor NÃO é exibido — nem
 *   no DOM — para quem não é o dono do voto e a rodada não foi revelada
 *   ainda (FR-003/FR-004/SC-002, o requisito mais crítico da feature).
 * - revelado: o valor fica visível, seja porque a rodada foi revelada
 *   (`revelado`) ou porque este é o próprio assento do usuário (`souEu`,
 *   FR-004a — o sigilo só vale em relação aos OUTROS participantes).
 */
export default function SeatCard({ participante, voto, revelado, souEu, indice = 0 }: SeatCardProps) {
  const jaVotou = voto !== undefined;
  const mostrarValor = jaVotou && (revelado || souEu);

  const estadoVisual = !jaVotou ? "vazio" : mostrarValor ? "revelado" : "oculto";

  const classeCarta = [styles.carta, styles[estadoVisual], souEu && styles.souEu]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={styles.item}>
      <div
        className={classeCarta}
        style={{ transitionDelay: estadoVisual === "revelado" ? `${indice * 60}ms` : "0ms" }}
        aria-label={
          !jaVotou
            ? `${participante.nome}: ainda não votou`
            : mostrarValor
              ? `${participante.nome}: votou ${voto}`
              : `${participante.nome}: já votou`
        }
      >
        <div className={styles.flipper}>
          <div className={styles.faceVerso} aria-hidden={mostrarValor}>
            <span className={styles.versoMarca} />
          </div>
          <div className={styles.faceFrente} aria-hidden={!mostrarValor}>
            {mostrarValor && voto !== undefined && <ValorCarta valor={voto} />}
          </div>
        </div>
      </div>
      <span className={[styles.nome, souEu && styles.souEu].filter(Boolean).join(" ")}>
        {participante.nome}
        {souEu && " (você)"}
      </span>
      {revelado && !jaVotou && <span className={styles.naoVotou}>Não votou</span>}
    </li>
  );
}
