import { describe, expect, it } from "vitest";
import { avatarOf, initialsOf, shortenName } from "../../src/services/avatar";
import { Participant } from "../../src/types/room";

const VALID_COLORS = ["var(--accent-a)", "var(--accent-b)", "var(--btn-a)", "var(--btn-b)"];

function createParticipant(overrides: Partial<Participant> = {}): Participant {
  return { id: "p-1", name: "Ana Costa", isModerator: false, joinedAt: 0, ...overrides };
}

describe("initialsOf", () => {
  it("usa a primeira letra do primeiro e do último nome, maiúsculas", () => {
    expect(initialsOf("Ana Costa")).toBe("AC");
  });

  it("usa só a primeira letra para nomes de uma palavra", () => {
    expect(initialsOf("Bruno")).toBe("B");
  });

  it("ignora espaços extras", () => {
    expect(initialsOf("  Carla   Dias  ")).toBe("CD");
  });
});

describe("shortenName", () => {
  it("mantém nomes de uma palavra sem alteração", () => {
    expect(shortenName("Bruno")).toBe("Bruno");
  });

  it("mantém nomes de duas palavras sem alteração", () => {
    expect(shortenName("Ana Costa")).toBe("Ana Costa");
  });

  it("abrevia nomes do meio para uma inicial maiúscula, mantendo primeiro e último por extenso", () => {
    expect(shortenName("Edson Roberto Salzano Junior")).toBe("Edson R S Junior");
  });

  it("funciona com apenas um nome do meio", () => {
    expect(shortenName("Edson Salzano Junior")).toBe("Edson S Junior");
  });

  it("ignora espaços extras", () => {
    expect(shortenName("  Edson   Roberto   Junior  ")).toBe("Edson R Junior");
  });
});

describe("avatarOf", () => {
  it("é determinístico — o mesmo participante sempre produz o mesmo avatar", () => {
    const participant = createParticipant();
    expect(avatarOf(participant)).toEqual(avatarOf(participant));
  });

  it("usa as iniciais do nome do participante", () => {
    const avatar = avatarOf(createParticipant({ name: "Bruno Silva" }));
    expect(avatar.initials).toBe("BS");
  });

  it("sempre escolhe uma cor dentro da paleta já existente do PokerFlow", () => {
    const colors = ["p-1", "p-2", "p-3", "p-4", "p-5"].map(
      (id) => avatarOf(createParticipant({ id })).color,
    );
    colors.forEach((color) => expect(VALID_COLORS).toContain(color));
  });

  it("participantes com IDs diferentes tendem a ter cores diferentes (distribuição, não colisão garantida)", () => {
    const colors = new Set(
      ["p-1", "p-2", "p-3", "p-4"].map((id) => avatarOf(createParticipant({ id })).color),
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});
