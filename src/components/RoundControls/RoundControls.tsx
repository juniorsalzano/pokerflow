import { EstadoRodada } from "../../types/room";
import styles from "./RoundControls.module.css";

interface RoundControlsProps {
  estado: EstadoRodada;
  onRevelar: () => void;
  onResetar: () => void;
  carregando?: boolean;
}

/**
 * Botões Revelar/Resetar — o chamador (RoomPage) só renderiza este
 * componente quando `ehModerador` for verdadeiro (defesa em profundidade,
 * já que `roomStore.revelar`/`resetar` também validam o moderador —
 * research.md §4). "Revelar" só faz sentido enquanto a rodada está aberta;
 * "Resetar" é aceito em qualquer estado (FR-012). Ambos os botões ficam
 * sempre montados (nunca somem do layout) para não deslocar o conteúdo
 * abaixo a cada mudança de estado — "Revelar" só fica desabilitado depois
 * que a rodada é revelada.
 */
export default function RoundControls({ estado, onRevelar, onResetar, carregando }: RoundControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.revelar}
        onClick={onRevelar}
        disabled={estado !== "votando" || carregando}
      >
        Revelar
      </button>
      <button type="button" className={styles.resetar} onClick={onResetar} disabled={carregando}>
        Resetar
      </button>
    </div>
  );
}
