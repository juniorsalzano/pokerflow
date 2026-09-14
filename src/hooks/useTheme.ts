import { useCallback, useEffect, useState } from "react";

type Tema = "dark" | "light";

const CHAVE = "pokerflow:tema";

function lerTemaSalvo(): Tema {
  const salvo = localStorage.getItem(CHAVE);
  return salvo === "light" ? "light" : "dark";
}

/** Tema escuro é o padrão do PokerFlow; o usuário pode alternar para o claro. */
export function useTheme() {
  const [tema, setTema] = useState<Tema>(() => lerTemaSalvo());

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem(CHAVE, tema);
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((atual) => (atual === "dark" ? "light" : "dark"));
  }, []);

  return { tema, alternar };
}
