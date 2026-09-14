import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomClient } from "../services/roomClient";
import { ValidationError } from "../services/mock/validation";
import { CriarSalaInput } from "../types/room";
import { salvarIdentidade } from "./useModerator";

export function useCreateRoom() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const criarSala = useCallback(
    async (input: CriarSalaInput) => {
      setErro(null);
      setCarregando(true);
      try {
        const { codigo, sala } = await roomClient.criarSala(input);
        salvarIdentidade(codigo, { participanteId: sala.moderadorId, ehModerador: true });
        navigate(`/sala/${codigo}`);
      } catch (e) {
        // Só exibimos a mensagem de erros conhecidos e já pensados para o
        // usuário; qualquer outro erro inesperado usa uma mensagem genérica,
        // para nunca vazar detalhes técnicos (Princípio VI).
        setErro(
          e instanceof ValidationError
            ? e.message
            : "Não foi possível criar a sala. Tente novamente.",
        );
      } finally {
        setCarregando(false);
      }
    },
    [navigate],
  );

  return { criarSala, erro, carregando };
}
