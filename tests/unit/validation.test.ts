import { describe, expect, it } from "vitest";
import { validateParticipantName, validateRoomName } from "../../src/services/mock/validation";

describe("validation — validateRoomName", () => {
  it("aceita um nome válido, removendo espaços nas pontas", () => {
    expect(validateRoomName("  Refinamento  ")).toBe("Refinamento");
  });

  it("rejeita nome vazio", () => {
    expect(() => validateRoomName("")).toThrow();
    expect(() => validateRoomName("   ")).toThrow();
  });

  it("rejeita nome maior que 60 caracteres", () => {
    expect(() => validateRoomName("a".repeat(61))).toThrow();
  });

  it("sanitiza caracteres de marcação HTML/script", () => {
    expect(validateRoomName('<script>alert(1)</script>Sala')).not.toContain("<");
  });
});

describe("validation — validateParticipantName", () => {
  it("aceita um nome válido", () => {
    expect(validateParticipantName("Ana")).toBe("Ana");
  });

  it("rejeita nome vazio", () => {
    expect(() => validateParticipantName("")).toThrow();
  });

  it("rejeita nome maior que 30 caracteres", () => {
    expect(() => validateParticipantName("a".repeat(31))).toThrow();
  });
});
