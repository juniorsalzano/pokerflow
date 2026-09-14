import { useEffect, useState } from "react";

export interface Identidade {
  participanteId: string;
  ehModerador: boolean;
  /** Credencial secreta (achado D1, feature 003) — só existe com o backend real; ausente na fase mock. */
  token?: string;
}

function chave(codigo: string): string {
  return `pokerflow:eu:${codigo}`;
}

/**
 * Persiste quem o usuário deste navegador é dentro de uma sala (FR-010).
 *
 * Usa localStorage (não sessionStorage): a identidade precisa sobreviver a
 * fechar a aba e reabrir pelo link da sala depois, não só a um F5. Uma
 * versão anterior usava sessionStorage para impedir que uma segunda aba do
 * mesmo navegador fosse reconhecida como o mesmo participante — mas contra
 * o backend real isso fazia reabrir a sala virar um participante novo de
 * verdade a cada vez. Efeito colateral aceito: duas abas da mesma sala no
 * mesmo navegador agora contam como a mesma pessoa (o que é correto — são
 * a mesma pessoa).
 */
export function salvarIdentidade(codigo: string, identidade: Identidade): void {
  localStorage.setItem(chave(codigo), JSON.stringify(identidade));
}

export function lerIdentidade(codigo: string): Identidade | null {
  const bruto = localStorage.getItem(chave(codigo));
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Identidade;
  } catch {
    return null;
  }
}

/**
 * Hook que expõe a identidade local do usuário para uma sala — sobrevive a
 * fechar/reabrir a aba porque lê de localStorage (FR-010), sem exigir novo
 * login.
 */
export function useModerator(codigo: string | undefined) {
  const [identidade, setIdentidade] = useState<Identidade | null>(() =>
    codigo ? lerIdentidade(codigo) : null,
  );

  useEffect(() => {
    if (codigo) {
      setIdentidade(lerIdentidade(codigo));
    }
  }, [codigo]);

  return {
    identidade,
    ehModerador: identidade?.ehModerador ?? false,
    salvarIdentidade: (nova: Identidade) => {
      if (!codigo) return;
      salvarIdentidade(codigo, nova);
      setIdentidade(nova);
    },
  };
}
