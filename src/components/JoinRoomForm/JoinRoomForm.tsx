import { FormEvent, useState } from "react";
import LoadingIcon from "../LoadingIcon/LoadingIcon";
import styles from "./JoinRoomForm.module.css";

interface JoinRoomFormProps {
  roomName: string;
  onSubmit: (name: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function JoinRoomForm({ roomName, onSubmit, loading, error }: JoinRoomFormProps) {
  const [name, setName] = useState("");
  const [triedSubmit, setTriedSubmit] = useState(false);

  const isNameValid = name.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    if (!isNameValid) return;
    onSubmit(name);
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>Entrar na sala</p>
      <h1 className={styles.title}>{roomName}</h1>
      <p className={styles.subtitle}>Informe seu nome para entrar — sem cadastro.</p>

      <div className={styles.field}>
        <label htmlFor="participantName">Seu nome</label>
        <input
          id="participantName"
          type="text"
          placeholder="Como o time vai te ver"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
        />
        {triedSubmit && !isNameValid && (
          <span className={styles.fieldError}>Informe seu nome.</span>
        )}
      </div>

      {error && <p className={styles.generalError}>{error}</p>}

      <button
        type="submit"
        className={styles.cta}
        disabled={loading}
        aria-busy={loading}
        aria-label={loading ? "Entrando na sala" : undefined}
      >
        {loading ? <LoadingIcon size={28} /> : "Entrar na sala →"}
      </button>
    </form>
  );
}
