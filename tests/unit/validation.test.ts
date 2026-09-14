import { describe, expect, it } from "vitest";
import { validarNomeParticipante, validarNomeSala } from "../../src/services/mock/validation";

describe("validation — validarNomeSala", () => {
  it("aceita um nome válido, removendo espaços nas pontas", () => {
    expect(validarNomeSala("  Refinamento  ")).toBe("Refinamento");
  });

  it("rejeita nome vazio", () => {
    expect(() => validarNomeSala("")).toThrow();
    expect(() => validarNomeSala("   ")).toThrow();
  });

  it("rejeita nome maior que 60 caracteres", () => {
    expect(() => validarNomeSala("a".repeat(61))).toThrow();
  });

  it("sanitiza caracteres de marcação HTML/script", () => {
    expect(validarNomeSala('<script>alert(1)</script>Sala')).not.toContain("<");
  });
});

describe("validation — validarNomeParticipante", () => {
  it("aceita um nome válido", () => {
    expect(validarNomeParticipante("Ana")).toBe("Ana");
  });

  it("rejeita nome vazio", () => {
    expect(() => validarNomeParticipante("")).toThrow();
  });

  it("rejeita nome maior que 30 caracteres", () => {
    expect(() => validarNomeParticipante("a".repeat(31))).toThrow();
  });
});
