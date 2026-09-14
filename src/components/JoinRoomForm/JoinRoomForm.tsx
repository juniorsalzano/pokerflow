import { FormEvent, useState } from "react";
import styles from "./JoinRoomForm.module.css";

interface JoinRoomFormProps {
  nomeSala: string;
  onSubmit: (nome: string) => void;
  carregando?: boolean;
  erro?: string | null;
}

export default function JoinRoomForm({ nomeSala, onSubmit, carregando, erro }: JoinRoomFormProps) {
  const [nome, setNome] = useState("");
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const nomeValido = nome.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTentouEnviar(true);
    if (!nomeValido) return;
    onSubmit(nome);
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>Entrar na sala</p>
      <h1 className={styles.title}>{nomeSala}</h1>
      <p className={styles.subtitle}>Informe seu nome para entrar — sem cadastro.</p>

      <div className={styles.field}>
        <label htmlFor="nomeParticipante">Seu nome</label>
        <input
          id="nomeParticipante"
          type="text"
          placeholder="Como o time vai te ver"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={30}
        />
        {tentouEnviar && !nomeValido && (
          <span className={styles.erroCampo}>Informe seu nome.</span>
        )}
      </div>

      {erro && <p className={styles.erroGeral}>{erro}</p>}

      <button type="submit" className={styles.cta} disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar na sala →"}
      </button>
    </form>
  );
}
