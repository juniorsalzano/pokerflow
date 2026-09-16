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
  it("o menu começa fechado — nem 'Sair da sala' nem 'Tema claro/escuro' aparecem", () => {
    render(<TopbarMenu onLeave={vi.fn()} />);
    expect(screen.queryByText("Sair da sala")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("clicar no botão de reticências abre o menu com os dois itens", async () => {
    render(<TopbarMenu onLeave={vi.fn()} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Sair da sala")).toBeInTheDocument();
    expect(screen.getByText(/^Tema (claro|escuro)$/)).toBeInTheDocument();
  });

  it("clicar em 'Sair da sala' aciona onLeave e fecha o menu", async () => {
    const onLeave = vi.fn();
    render(<TopbarMenu onLeave={onLeave} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));

    await userEvent.click(screen.getByText("Sair da sala"));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("clicar em alternar tema muda o rótulo do item e fecha o menu, sem chamar onLeave", async () => {
    const onLeave = vi.fn();
    render(<TopbarMenu onLeave={onLeave} />);
    await userEvent.click(screen.getByLabelText("Mais opções"));
    const themeItem = screen.getByText(/^Tema (claro|escuro)$/);
    const initialLabel = themeItem.textContent;

    await userEvent.click(themeItem);

    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Mais opções"));
    expect(screen.getByText(/^Tema (claro|escuro)$/).textContent).not.toBe(initialLabel);
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
