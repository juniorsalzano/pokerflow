import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TopbarMenu from "../../src/components/TopbarMenu/TopbarMenu";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TopbarMenu — agrupa tema e sair atrás de um menu (⋯)", () => {
  it("o menu começa fechado — nem 'Sair da sala' nem o switch de tema aparecem", () => {
    render(<TopbarMenu onLeave={vi.fn()} />);
    expect(screen.queryByText("Sair da sala")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("clicar no botão de reticências abre o menu com o switch de tema e 'Sair da sala'", async () => {
    render(<TopbarMenu onLeave={vi.fn()} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Sair da sala")).toBeInTheDocument();
    expect(screen.getByText("Tema")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mudar para tema (claro|escuro)/)).toBeInTheDocument();
  });

  it("clicar em 'Sair da sala' aciona onLeave e fecha o menu", async () => {
    const onLeave = vi.fn();
    render(<TopbarMenu onLeave={onLeave} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));

    await userEvent.click(screen.getByText("Sair da sala"));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("clicar no switch troca o tema (aria-pressed muda) SEM fechar o menu nem chamar onLeave", async () => {
    const onLeave = vi.fn();
    render(<TopbarMenu onLeave={onLeave} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));
    const initialPressed = screen.getByRole("button", { name: /Mudar para tema/ }).getAttribute("aria-pressed");

    await userEvent.click(screen.getByRole("button", { name: /Mudar para tema/ }));

    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mudar para tema/ }).getAttribute("aria-pressed")).not.toBe(
      initialPressed,
    );
  });

  it("clicar fora do menu fecha ele, sem acionar nenhuma ação", async () => {
    const onLeave = vi.fn();
    render(
      <div>
        <TopbarMenu onLeave={onLeave} />
        <button type="button">fora</button>
      </div>,
    );
    await userEvent.click(screen.getByLabelText("Mais opções"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.click(screen.getByText("fora"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("tecla Escape fecha o menu", async () => {
    render(<TopbarMenu onLeave={vi.fn()} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
