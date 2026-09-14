import { describe, expect, it } from "vitest";
import {
  adicionarParticipante,
  criarSala,
  removerParticipante,
  resumoRodada,
  votar,
} from "../../src/services/mock/roomStore";

describe("roomStore — resumoRodada", () => {
  it("indica consenso quando todos os participantes atuais votam o mesmo valor", () => {
    let sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");
    sala = comBruno;
    sala = votar(sala, sala.moderadorId, "5");
    sala = votar(sala, bruno.id, "5");

    const resumo = resumoRodada(sala);
    expect(resumo.votaram).toBe(2);
    expect(resumo.naoVotaram).toEqual([]);
    expect(resumo.resultado).toEqual({ tipo: "consenso", valor: "5" });
  });

  it("indica dispersão (faixa min-max) para escala numérica com votos diferentes", () => {
    let sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");
    sala = comBruno;
    const { sala: comCarla, participante: carla } = adicionarParticipante(sala, "Carla");
    sala = comCarla;
    sala = votar(sala, sala.moderadorId, "5");
    sala = votar(sala, bruno.id, "8");
    sala = votar(sala, carla.id, "3");

    const resumo = resumoRodada(sala);
    expect(resumo.resultado).toEqual({ tipo: "dispersao", min: "3", max: "8" });
  });

  it("indica sem-consenso para escala de camisetas (não-numérica) com votos diferentes", () => {
    let sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "camisetas" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");
    sala = comBruno;
    sala = votar(sala, sala.moderadorId, "P");
    sala = votar(sala, bruno.id, "GG");

    const resumo = resumoRodada(sala);
    expect(resumo.resultado).toEqual({ tipo: "sem-consenso" });
  });

  it("indica sem-consenso quando há mistura de valor numérico com '?' ou '☕'", () => {
    let sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");
    sala = comBruno;
    sala = votar(sala, sala.moderadorId, "5");
    sala = votar(sala, bruno.id, "☕");

    const resumo = resumoRodada(sala);
    expect(resumo.resultado).toEqual({ tipo: "sem-consenso" });
  });

  it("lista participantes sem voto em naoVotaram", () => {
    let sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");
    sala = comBruno;
    sala = votar(sala, sala.moderadorId, "5");

    const resumo = resumoRodada(sala);
    expect(resumo.votaram).toBe(1);
    expect(resumo.naoVotaram.map((p) => p.id)).toEqual([bruno.id]);
  });

  it("não conta o voto de um participante que já saiu da sala", () => {
    let sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const { sala: comBruno, participante: bruno } = adicionarParticipante(sala, "Bruno");
    sala = comBruno;
    sala = votar(sala, sala.moderadorId, "5");
    sala = votar(sala, bruno.id, "8");

    // Bruno sai da sala, mas seu voto órfão continua em rodada.votos.
    sala = removerParticipante(sala, bruno.id);

    const resumo = resumoRodada(sala);
    expect(resumo.votaram).toBe(1);
    expect(resumo.naoVotaram).toEqual([]);
    expect(resumo.resultado).toEqual({ tipo: "consenso", valor: "5" });
  });

  it("retorna sem-consenso quando ninguém votou ainda", () => {
    const sala = criarSala({ nomeSala: "S", nomeCriador: "Ana", escalaPontos: "fibonacci" });
    const resumo = resumoRodada(sala);
    expect(resumo.votaram).toBe(0);
    expect(resumo.resultado).toEqual({ tipo: "sem-consenso" });
  });
});
