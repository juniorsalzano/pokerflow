import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TablePanel from "../../src/components/TablePanel/TablePanel";

describe("TablePanel — destaque do mais votado quando o resultado aparece", () => {
  it("não mostra nada de 'mais votado' fora da fase 'result', mesmo se o prop vier preenchido", () => {
    render(<TablePanel phase="voting" countdownNumber={null} mostVoted={{ value: "5", count: 3, total: 5 }} />);
    expect(screen.queryByText("Mais votado")).not.toBeInTheDocument();
  });

  it("não mostra nada de 'mais votado' na fase 'result' se ninguém votou (sem mostVoted)", () => {
    render(<TablePanel phase="result" countdownNumber={null} />);
    expect(screen.queryByText("Mais votado")).not.toBeInTheDocument();
  });

  it("mostra o valor mais votado e a contagem 'X de Y votos' na fase 'result'", () => {
    render(<TablePanel phase="result" countdownNumber={null} mostVoted={{ value: "8", count: 3, total: 5 }} />);
    expect(screen.getByText("Mais votado")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3 de 5 votos")).toBeInTheDocument();
  });

  it("usa o singular 'voto' quando a sala tem só 1 participante", () => {
    render(<TablePanel phase="result" countdownNumber={null} mostVoted={{ value: "5", count: 1, total: 1 }} />);
    expect(screen.getByText("1 de 1 voto")).toBeInTheDocument();
  });

  it("renderiza o ícone de pausa/incerteza (☕) via CardValue, não o emoji cru", () => {
    render(<TablePanel phase="result" countdownNumber={null} mostVoted={{ value: "☕", count: 2, total: 4 }} />);
    expect(screen.queryByText("☕")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Pausa / incerteza")).toBeInTheDocument();
  });
});
