const NOME_SALA_MAX = 60;
const NOME_PARTICIPANTE_MAX = 30;

/**
 * Erro de validação com mensagem segura para mostrar ao usuário (Princípio VI
 * — nunca expor detalhes técnicos). Distinto de um erro inesperado/bug, cuja
 * mensagem NÃO deve ser exibida diretamente.
 */
export class ValidationError extends Error {}

/**
 * Remove marcação HTML/script do texto (Princípio VI da constitution).
 * Estratégia simples e segura: descarta os caracteres que dão início a tags
 * ou entidades, em vez de tentar um allowlist de tags — não há necessidade
 * de HTML nos nomes de sala/participante.
 */
function sanitizar(texto: string): string {
  return texto.replace(/[<>&"'`]/g, "").trim();
}

export function validarNomeSala(nomeBruto: string): string {
  const nome = sanitizar(nomeBruto);
  if (nome.length < 1) {
    throw new ValidationError("Informe um nome para a sala.");
  }
  if (nome.length > NOME_SALA_MAX) {
    throw new ValidationError(`O nome da sala deve ter no máximo ${NOME_SALA_MAX} caracteres.`);
  }
  return nome;
}

export function validarNomeParticipante(nomeBruto: string): string {
  const nome = sanitizar(nomeBruto);
  if (nome.length < 1) {
    throw new ValidationError("Informe seu nome.");
  }
  if (nome.length > NOME_PARTICIPANTE_MAX) {
    throw new ValidationError(
      `O nome deve ter no máximo ${NOME_PARTICIPANTE_MAX} caracteres.`,
    );
  }
  return nome;
}

export function nomesIguaisCaseInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
