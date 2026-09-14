import { RoomClient } from "../roomClient";
import { lerIdentidade } from "../../hooks/useModerator";
import { CriarSalaInput, ErroRoomClient, RoomClientError, Sala } from "../../types/room";

const INTERVALO_POLLING_MS = 2000;
/** Placeholder para o voto de outro participante ainda não revelado — nunca é o valor real (achado D1). */
const VOTO_OCULTO_PLACEHOLDER = "•";

function baseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

interface RodadaRedigida {
  estado: "votando" | "revelada";
  votantes: string[];
  meuVoto?: string;
  votos?: Record<string, string>;
}

interface SalaRedigida extends Omit<Sala, "rodada"> {
  rodada: RodadaRedigida;
}

interface CorpoErro {
  codigo?: ErroRoomClient;
  mensagem?: string;
}

/**
 * Chama a API real. Erros de negócio (corpo `{codigo, mensagem}` reconhecido)
 * viram `RoomClientError`. Qualquer outra falha (rede indisponível, timeout,
 * 5xx sem corpo JSON) propaga como erro comum — nunca vira `RoomClientError`
 * (achado E1, `research.md` §11): os hooks já existentes (`useRodada`,
 * `useJoinRoom`, `useCreateRoom`) já mostram uma mensagem genérica de "tente
 * novamente" para qualquer erro que não seja `RoomClientError`.
 */
async function chamarApi<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${baseUrl()}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!resposta.ok) {
    let corpo: CorpoErro | undefined;
    try {
      corpo = (await resposta.json()) as CorpoErro;
    } catch {
      corpo = undefined;
    }
    if (corpo?.codigo && corpo?.mensagem) {
      throw new RoomClientError(corpo.codigo, corpo.mensagem);
    }
    throw new Error(`Falha na requisição (${resposta.status})`);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }
  return (await resposta.json()) as T;
}

/**
 * Reconstrói o `Rodada.votos` interno (formato que os componentes já
 * esperam) a partir do payload redigido do servidor (contracts/api-contract.md).
 * O valor real de outro participante nunca chega até aqui antes do reveal —
 * `VOTO_OCULTO_PLACEHOLDER` só serve para `voto !== undefined` continuar
 * disparando o estado "já votou" no `SeatCard`.
 */
function reconstruirSala(bruta: SalaRedigida, meuId: string | undefined): Sala {
  const votos: Record<string, string> = {};

  if (bruta.rodada.estado === "revelada" && bruta.rodada.votos) {
    Object.assign(votos, bruta.rodada.votos);
  } else {
    for (const id of bruta.rodada.votantes) {
      votos[id] = id === meuId && bruta.rodada.meuVoto !== undefined ? bruta.rodada.meuVoto : VOTO_OCULTO_PLACEHOLDER;
    }
  }

  return { ...bruta, rodada: { estado: bruta.rodada.estado, votos } };
}

function identidadeAtual(codigo: string): { participanteId: string; token: string } | undefined {
  const identidade = lerIdentidade(codigo);
  if (!identidade?.token) return undefined;
  return { participanteId: identidade.participanteId, token: identidade.token };
}

async function buscarSala(codigo: string): Promise<Sala | null> {
  const quemPergunta = identidadeAtual(codigo);
  const query = quemPergunta
    ? `?participanteId=${encodeURIComponent(quemPergunta.participanteId)}&token=${encodeURIComponent(quemPergunta.token)}`
    : "";

  try {
    const bruta = await chamarApi<SalaRedigida>(`/rooms/${codigo}${query}`);
    return reconstruirSala(bruta, quemPergunta?.participanteId);
  } catch (e) {
    if (e instanceof RoomClientError && e.codigo === "SALA_NAO_ENCONTRADA") {
      return null;
    }
    throw e;
  }
}

// Assinantes locais (dentro desta mesma aba) por código de sala — mesmo
// padrão do mockRoomClient. Existe para que `votar`/`revelar`/`resetar`
// consigam notificar a própria tela na hora (ver `notificarAssinantes`),
// em vez de depender do próximo tick do polling (até INTERVALO_POLLING_MS
// de atraso perceptível no "efeito" da própria ação).
const assinantesPorCodigo = new Map<string, Set<(sala: Sala | null) => void>>();
const ultimoPayloadPorCodigo = new Map<string, string | null>();

function notificarAssinantes(codigo: string, sala: Sala | null): void {
  const payload = JSON.stringify(sala);
  if (payload === ultimoPayloadPorCodigo.get(codigo)) return;
  ultimoPayloadPorCodigo.set(codigo, payload);
  assinantesPorCodigo.get(codigo)?.forEach((cb) => cb(sala));
}

export const httpRoomClient: RoomClient = {
  async criarSala(input: CriarSalaInput) {
    const resposta = await chamarApi<{ codigo: string; participanteId: string; token: string; sala: SalaRedigida }>(
      "/rooms",
      { method: "POST", body: JSON.stringify(input) },
    );
    return {
      codigo: resposta.codigo,
      sala: reconstruirSala(resposta.sala, resposta.participanteId),
      token: resposta.token,
    };
  },

  async entrarNaSala(codigo: string, nomeParticipante: string) {
    const resposta = await chamarApi<{ participanteId: string; token: string; sala: SalaRedigida }>(
      `/rooms/${codigo}/participantes`,
      { method: "POST", body: JSON.stringify({ nomeParticipante }) },
    );
    return {
      participanteId: resposta.participanteId,
      sala: reconstruirSala(resposta.sala, resposta.participanteId),
      token: resposta.token,
    };
  },

  async obterSala(codigo: string) {
    return buscarSala(codigo);
  },

  assinarSala(codigo: string, callback: (sala: Sala | null) => void) {
    if (!assinantesPorCodigo.has(codigo)) {
      assinantesPorCodigo.set(codigo, new Set());
    }
    const assinantes = assinantesPorCodigo.get(codigo)!;
    assinantes.add(callback);

    async function consultar() {
      const sala = await buscarSala(codigo).catch(() => undefined);
      // Se a inscrição já foi cancelada (ou outra chamada mais recente já
      // notificou), o `Set` não contém mais este `callback` — mas a
      // notificação é sempre para todos os assinantes atuais do código, não
      // só para quem disparou o `consultar`, então isso é seguro mesmo com
      // respostas atrasadas chegando fora de ordem.
      if (sala === undefined) return;
      notificarAssinantes(codigo, sala);
    }

    void consultar();
    const intervalo = setInterval(consultar, INTERVALO_POLLING_MS);

    return () => {
      assinantes.delete(callback);
      clearInterval(intervalo);
      if (assinantes.size === 0) {
        assinantesPorCodigo.delete(codigo);
        ultimoPayloadPorCodigo.delete(codigo);
      }
    };
  },

  async sairDaSala(codigo: string, participanteId: string) {
    const identidade = identidadeAtual(codigo);
    const query = identidade?.token ? `?token=${encodeURIComponent(identidade.token)}` : "";
    // `keepalive` é essencial aqui: esta chamada é disparada a partir do
    // handler de `beforeunload` (RoomPage), e navegadores abortam fetches
    // não-keepalive quando a página está descarregando — sem isso, "sair da
    // sala" ao fechar a aba vira um no-op silencioso contra o backend real.
    await chamarApi<void>(`/rooms/${codigo}/participantes/${participanteId}${query}`, {
      method: "DELETE",
      keepalive: true,
    });
  },

  async votar(codigo: string, participanteId: string, valor: string) {
    const token = identidadeAtual(codigo)?.token ?? "";
    const bruta = await chamarApi<SalaRedigida>(`/rooms/${codigo}/votos`, {
      method: "POST",
      body: JSON.stringify({ participanteId, token, valor }),
    });
    const sala = reconstruirSala(bruta, participanteId);
    notificarAssinantes(codigo, sala);
    return sala;
  },

  async revelar(codigo: string, participanteId: string) {
    const token = identidadeAtual(codigo)?.token ?? "";
    const bruta = await chamarApi<SalaRedigida>(`/rooms/${codigo}/revelar`, {
      method: "POST",
      body: JSON.stringify({ participanteId, token }),
    });
    const sala = reconstruirSala(bruta, participanteId);
    notificarAssinantes(codigo, sala);
    return sala;
  },

  async resetar(codigo: string, participanteId: string) {
    const token = identidadeAtual(codigo)?.token ?? "";
    const bruta = await chamarApi<SalaRedigida>(`/rooms/${codigo}/resetar`, {
      method: "POST",
      body: JSON.stringify({ participanteId, token }),
    });
    const sala = reconstruirSala(bruta, participanteId);
    notificarAssinantes(codigo, sala);
    return sala;
  },
};
