import { ResumoRodada } from "../../types/room";
import ValorCarta from "../ValorCarta/ValorCarta";
import styles from "./ConsensusBadge.module.css";

interface ConsensusBadgeProps {
  resumo: ResumoRodada;
}

/** Indicador de consenso/dispersão pós-reveal (US2), consumindo `resumoRodada` (research.md §2). */
export default function ConsensusBadge({ resumo }: ConsensusBadgeProps) {
  const { resultado } = resumo;

  if (resultado.tipo === "consenso") {
    return (
      <div className={`${styles.badge} ${styles.consenso}`}>
        <span className={styles.rotulo}>Consenso</span>
        <span className={styles.valor}>
          <ValorCarta valor={resultado.valor} />
        </span>
      </div>
    );
  }

  if (resultado.tipo === "dispersao") {
    return (
      <div className={`${styles.badge} ${styles.dispersao}`}>
        <span className={styles.rotulo}>Dispersão</span>
        <span className={styles.valor}>
          {resultado.min}–{resultado.max}
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.badge} ${styles.semConsenso}`}>
      <span className={styles.rotulo}>Sem consenso</span>
    </div>
  );
}
