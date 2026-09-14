import { useEffect, useState } from "react";

export interface Identidade {
  participanteId: string;
  ehModerador: boolean;
}

function chave(codigo: string): string {
  return `pokerflow:eu:${codigo}`;
}

/**
 * Persiste quem o usuário desta ABA é dentro de uma sala (FR-010).
 *
 * Usa sessionStorage (não localStorage) de propósito: sessionStorage
 * sobrevive a um F5 na mesma aba (o que FR-010 exige), mas NÃO é
 * compartilhado entre abas diferentes — cada aba nova precisa entrar como
 * um participante próprio, mesmo no mesmo navegador/link. Com localStorage,
 * abrir a mesma sala em uma segunda aba reconheceria incorretamente a
 * pessoa como o mesmo participante (ou moderador) da primeira aba.
 */
export function salvarIdentidade(codigo: string, identidade: Identidade): void {
  sessionStorage.setItem(chave(codigo), JSON.stringify(identidade));
}

export function lerIdentidade(codigo: string): Identidade | null {
  const bruto = sessionStorage.getItem(chave(codigo));
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Identidade;
  } catch {
    return null;
  }
}

/**
 * Hook que expõe a identidade local do usuário para uma sala — sobrevive a
 * um F5 porque lê de sessionStorage (FR-010), sem exigir novo login.
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
