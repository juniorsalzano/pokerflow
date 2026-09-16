import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TablePanel from "../../src/components/TablePanel/TablePanel";

describe("TablePanel — destaque do mais votado quando o resultado aparece", () => {
  it("não mostra nada de 'mais votado' fora da fase 'result', mesmo se o prop vier preenchido", () => {
    render(<TablePanel phase="voting" countdownNumber={null} mostVoted={{ values: ["5"], count: 3, total: 5 }} />);
    expect(screen.queryByText("Mais votado")).not.toBeInTheDocument();
  });

  it("não mostra nada de 'mais votado' na fase 'result' se ninguém votou (sem mostVoted)", () => {
    render(<TablePanel phase="result" countdownNumber={null} />);
    expect(screen.queryByText("Mais votado")).not.toBeInTheDocument();
    expect(screen.queryByText("Empate")).not.toBeInTheDocument();
  });

  it("mostra o valor mais votado e a contagem 'X de Y votos' na fase 'result'", () => {
    render(<TablePanel phase="result" countdownNumber={null} mostVoted={{ values: ["8"], count: 3, total: 5 }} />);
    expect(screen.getByText("Mais votado")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3 de 5 votos")).toBeInTheDocument();
  });

  it("usa o singular 'voto' quando a sala tem só 1 participante", () => {
    render(<TablePanel phase="result" countdownNumber={null} mostVoted={{ values: ["5"], count: 1, total: 1 }} />);
    expect(screen.getByText("1 de 1 voto")).toBeInTheDocument();
  });

  it("renderiza o ícone de pausa/incerteza (☕) via CardValue, não o emoji cru", () => {
    render(<TablePanel phase="result" countdownNumber={null} mostVoted={{ values: ["☕"], count: 2, total: 4 }} />);
    expect(screen.queryByText("☕")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Pausa / incerteza")).toBeInTheDocument();
  });

  it("empate: mostra TODOS os valores empatados, rótulo vira 'Empate', sem afirmar que só um é o mais votado", () => {
    render(
      <TablePanel phase="result" countdownNumber={null} mostVoted={{ values: ["5", "8"], count: 2, total: 4 }} />,
    );
    expect(screen.getByText("Empate")).toBeInTheDocument();
    expect(screen.queryByText("Mais votado")).not.toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2 de 4 votos cada")).toBeInTheDocument();
  });

  it("empate de três valores: todos aparecem", () => {
    render(
      <TablePanel
        phase="result"
        countdownNumber={null}
        mostVoted={{ values: ["1", "2", "3"], count: 1, total: 3 }}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1 de 3 votos cada")).toBeInTheDocument();
  });
});
