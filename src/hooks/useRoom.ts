import { useEffect, useState } from "react";
import { roomClient } from "../services/roomClient";
import { Sala } from "../types/room";

/**
 * Mantém a sala atualizada em tempo real (SC-004: até poucos segundos),
 * assinando roomClient.assinarSala. `carregando` é true só até a primeira
 * leitura resolver; depois disso, `sala === null` significa "não encontrada".
 */
export function useRoom(codigo: string | undefined) {
  const [sala, setSala] = useState<Sala | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!codigo) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const cancelar = roomClient.assinarSala(codigo, (salaAtual) => {
      setSala(salaAtual);
      setCarregando(false);
    });
    return cancelar;
  }, [codigo]);

  return { sala, carregando };
}
