import ValorCarta from "../ValorCarta/ValorCarta";
import styles from "./HandOfCards.module.css";

interface HandOfCardsProps {
  valores: string[];
  valorSelecionado?: string;
  desabilitado?: boolean;
  onVotar: (valor: string) => void;
}

/**
 * Baralho clicável do próprio participante (US1). Ao clicar em uma carta, o
 * participante registra/troca o voto (FR-002/FR-005) — a carta escolhida
 * vira com um efeito 3D (`HandOfCards.module.css`, research.md §1) como
 * retorno visual imediato. `desabilitado` bloqueia novos cliques depois da
 * revelação (FR-009).
 */
export default function HandOfCards({
  valores,
  valorSelecionado,
  desabilitado,
  onVotar,
}: HandOfCardsProps) {
  return (
    <ul className={styles.mao} aria-label="Suas cartas">
      {valores.map((valor) => {
        const selecionada = valor === valorSelecionado;
        return (
          <li key={valor}>
            <button
              type="button"
              className={[styles.carta, selecionada && styles.selecionada].filter(Boolean).join(" ")}
              disabled={desabilitado}
              aria-pressed={selecionada}
              onClick={() => onVotar(valor)}
            >
              <span className={styles.flipper}>
                <span className={styles.faceFrente}>
                  <ValorCarta valor={valor} />
                </span>
                {/* Duplicata puramente visual do efeito de flip — mesmo valor da face
                    da frente, então fica oculta de leitores de tela (evita anunciar
                    o mesmo valor duas vezes). */}
                <span className={styles.faceVerso} aria-hidden="true">
                  <ValorCarta valor={valor} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
