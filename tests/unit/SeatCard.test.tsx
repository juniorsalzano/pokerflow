import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SeatCard from "../../src/components/SeatCard/SeatCard";
import { Participant } from "../../src/types/room";

const otherParticipant: Participant = {
  id: "p-outro",
  name: "Bruno",
  isModerator: false,
  joinedAt: 0,
};

describe("SeatCard — sigilo do voto (FR-003/FR-004/SC-002)", () => {
  it("NUNCA renderiza no DOM o valor votado por outro participante quando revealed=false", () => {
    const { container } = render(
      <SeatCard participant={otherParticipant} vote="8" revealed={false} isMe={false} />,
    );

    // O valor votado não pode aparecer em lugar nenhum do DOM renderizado —
    // nem visível, nem escondido via CSS, nem no texto de atributos como
    // aria-label (checa apenas o texto visível/textual, não o HTML bruto,
    // já que os nomes de classe CSS Modules podem conter dígitos por acaso).
    expect(screen.queryByText("8")).not.toBeInTheDocument();
    expect(container.textContent).not.toContain("8");
    expect(container.querySelector("[aria-label]")?.getAttribute("aria-label")).not.toContain("8");
  });

  it("indica apenas que o outro participante já votou, sem o valor, quando ainda oculto", () => {
    render(<SeatCard participant={otherParticipant} vote="8" revealed={false} isMe={false} />);
    expect(screen.getByLabelText("Bruno: já votou")).toBeInTheDocument();
  });

  it("indica que o participante ainda não votou (vazio)", () => {
    render(<SeatCard participant={otherParticipant} vote={undefined} revealed={false} isMe={false} />);
    expect(screen.getByLabelText("Bruno: ainda não votou")).toBeInTheDocument();
  });

  it("marca claramente 'Não votou' após a revelação para quem não votou (FR-008)", () => {
    render(<SeatCard participant={otherParticipant} vote={undefined} revealed={true} isMe={false} />);
    expect(screen.getByText("Não votou")).toBeInTheDocument();
  });

  it("exibe o valor de outro participante depois que a rodada é revelada", () => {
    render(<SeatCard participant={otherParticipant} vote="8" revealed={true} isMe={false} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});

describe("SeatCard — visibilidade do próprio voto (FR-004a)", () => {
  const meParticipant: Participant = {
    id: "p-eu",
    name: "Ana",
    isModerator: false,
    joinedAt: 0,
  };

  it("renderiza o valor do PRÓPRIO participante mesmo com revealed=false", () => {
    render(<SeatCard participant={meParticipant} vote="8" revealed={false} isMe={true} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("continua mostrando o próprio valor depois da revelação também", () => {
    render(<SeatCard participant={meParticipant} vote="8" revealed={true} isMe={true} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("recria o elemento da carta ao trocar de voto, para o flip (animation) reexecutar", () => {
    const { rerender } = render(
      <SeatCard participant={meParticipant} vote="8" revealed={false} isMe={true} />,
    );
    const firstFlipper = screen.getByText("8").parentElement;

    rerender(<SeatCard participant={meParticipant} vote="5" revealed={false} isMe={true} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    const secondFlipper = screen.getByText("5").parentElement;
    // Precisa ser um nó NOVO (não o mesmo reaproveitado): a animação CSS do
    // flip só toca em mount, não quando o conteúdo de um nó existente muda —
    // é isso que garante que ela reexecute a cada troca de voto, não só na
    // primeira vez.
    expect(secondFlipper).not.toBe(firstFlipper);
  });
});

describe("SeatCard — remoção pelo moderador (spec 005, US3)", () => {
  const otherParticipant: Participant = { id: "p-outro", name: "Bruno", isModerator: false, joinedAt: 0 };

  it("não mostra nenhuma ação de remover quando onRemove não é passado (participante comum vendo a sala, ou a própria linha do moderador)", () => {
    render(<SeatCard participant={otherParticipant} vote={undefined} revealed={false} isMe={false} />);
    expect(screen.queryByLabelText(/Remover/)).not.toBeInTheDocument();
  });

  it("mostra a ação de remover quando onRemove é passado, e aciona onRemove ao clicar", async () => {
    const onRemove = vi.fn();
    render(<SeatCard participant={otherParticipant} vote={undefined} revealed={false} isMe={false} onRemove={onRemove} />);

    const button = screen.getByLabelText("Remover Bruno da sala");
    await userEvent.click(button);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
