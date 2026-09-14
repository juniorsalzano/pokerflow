/**
 * Renderiza o valor de uma carta da escala de pontos. O valor "☕" (pausa/
 * incerteza da escala Fibonacci, ver src/types/room.ts) é desenhado como um
 * ícone SVG de xícara (stroke-based, mesmo estilo dos demais ícones do app)
 * em vez do caractere emoji — Identidade Visual do projeto exige "sem emoji
 * decorativo" (CLAUDE.md; research.md §3). O valor "?" continua como texto
 * simples, pois não é emoji.
 */
export default function ValorCarta({ valor }: { valor: string }) {
  if (valor === "☕") {
    return (
      <svg
        width="1.1em"
        height="1.1em"
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label="Pausa / incerteza"
      >
        <path
          d="M4 9h13v5.5A5.5 5.5 0 0 1 11.5 20h-2A5.5 5.5 0 0 1 4 14.5V9Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M17 10.5h1.2a2.3 2.3 0 1 1 0 4.6H17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M7.5 6c0-.9.9-.9.9-1.8S7.5 3.3 7.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M11.5 6c0-.9.9-.9.9-1.8S11.5 3.3 11.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return <>{valor}</>;
}
