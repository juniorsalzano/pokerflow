import { beforeEach, describe, expect, it } from "vitest";
import { mockRoomClient } from "../../src/services/mock/mockRoomClient";

describe("mockRoomClient — salas simultâneas são independentes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("duas salas criadas ao mesmo tempo recebem códigos diferentes", async () => {
    const { codigo: codigoA } = await mockRoomClient.criarSala({
      nomeSala: "Sala A",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });
    const { codigo: codigoB } = await mockRoomClient.criarSala({
      nomeSala: "Sala B",
      nomeCriador: "Bruno",
      escalaPontos: "sequencial",
    });

    expect(codigoA).not.toBe(codigoB);
  });

  it("participante que entra na sala A não aparece na sala B", async () => {
    const { codigo: codigoA } = await mockRoomClient.criarSala({
      nomeSala: "Sala A",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });
    const { codigo: codigoB } = await mockRoomClient.criarSala({
      nomeSala: "Sala B",
      nomeCriador: "Bruno",
      escalaPontos: "sequencial",
    });

    await mockRoomClient.entrarNaSala(codigoA, "Carla");

    const salaA = await mockRoomClient.obterSala(codigoA);
    const salaB = await mockRoomClient.obterSala(codigoB);

    expect(salaA?.participantes.map((p) => p.nome)).toEqual(["Ana", "Carla"]);
    expect(salaB?.participantes.map((p) => p.nome)).toEqual(["Bruno"]);
  });

  it("o mesmo nome pode ser usado em duas salas diferentes (unicidade é só dentro da sala)", async () => {
    const { codigo: codigoA } = await mockRoomClient.criarSala({
      nomeSala: "Sala A",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });
    const { codigo: codigoB } = await mockRoomClient.criarSala({
      nomeSala: "Sala B",
      nomeCriador: "Bruno",
      escalaPontos: "sequencial",
    });

    await expect(mockRoomClient.entrarNaSala(codigoB, "Ana")).resolves.toBeDefined();

    const salaB = await mockRoomClient.obterSala(codigoB);
    expect(salaB?.participantes.map((p) => p.nome)).toEqual(["Bruno", "Ana"]);
  });

  it("assinar a sala A não é notificado por mudanças na sala B", async () => {
    const { codigo: codigoA } = await mockRoomClient.criarSala({
      nomeSala: "Sala A",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });
    const { codigo: codigoB } = await mockRoomClient.criarSala({
      nomeSala: "Sala B",
      nomeCriador: "Bruno",
      escalaPontos: "sequencial",
    });

    const chamadas: Array<ReturnType<typeof Array>> = [];
    const unsubscribe = mockRoomClient.assinarSala(codigoA, (sala) => {
      chamadas.push(sala?.participantes.map((p) => p.nome) ?? null);
    });

    await mockRoomClient.entrarNaSala(codigoB, "Carla");

    // Só a notificação inicial (estado atual de A no momento da assinatura).
    expect(chamadas).toEqual([["Ana"]]);

    unsubscribe();
  });

  it("saída de um participante na sala A não afeta a sala B", async () => {
    const { codigo: codigoA, sala: salaA } = await mockRoomClient.criarSala({
      nomeSala: "Sala A",
      nomeCriador: "Ana",
      escalaPontos: "fibonacci",
    });
    const { codigo: codigoB } = await mockRoomClient.criarSala({
      nomeSala: "Sala B",
      nomeCriador: "Bruno",
      escalaPontos: "sequencial",
    });

    await mockRoomClient.sairDaSala(codigoA, salaA.participantes[0].id);

    const salaAAtualizada = await mockRoomClient.obterSala(codigoA);
    const salaB = await mockRoomClient.obterSala(codigoB);

    expect(salaAAtualizada?.participantes).toHaveLength(0);
    expect(salaB?.participantes.map((p) => p.nome)).toEqual(["Bruno"]);
  });
});
