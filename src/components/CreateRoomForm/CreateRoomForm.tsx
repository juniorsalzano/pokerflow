import { FormEvent, useState } from "react";
import LoadingIcon from "../LoadingIcon/LoadingIcon";
import { CreateRoomInput, PointScale, POINT_SCALE_LABELS } from "../../types/room";
import styles from "./CreateRoomForm.module.css";

const SCALES: PointScale[] = ["fibonacci", "sequential", "tshirts"];

interface CreateRoomFormProps {
  onSubmit: (input: CreateRoomInput) => void;
  loading?: boolean;
  error?: string | null;
}

export default function CreateRoomForm({ onSubmit, loading, error }: CreateRoomFormProps) {
  const [roomName, setRoomName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [pointScale, setPointScale] = useState<PointScale | null>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const isRoomNameValid = roomName.trim().length > 0;
  const isCreatorNameValid = creatorName.trim().length > 0;
  const isScaleValid = pointScale !== null;
  const isFormValid = isRoomNameValid && isCreatorNameValid && isScaleValid;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    if (!isFormValid || !pointScale) return;
    onSubmit({ roomName, creatorName, pointScale });
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>Nova sala</p>
      <h1 className={styles.title}>Crie sua sala de planning</h1>
      <p className={styles.subtitle}>
        Sem cadastro. Você entra como moderador assim que criar.
      </p>

      <div className={styles.field}>
        <label htmlFor="roomName">Nome da sala</label>
        <input
          id="roomName"
          type="text"
          placeholder="Ex: Refinamento Sprint 42"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          maxLength={60}
        />
        {triedSubmit && !isRoomNameValid && (
          <span className={styles.fieldError}>Informe um nome para a sala.</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="creatorName">Seu nome</label>
        <input
          id="creatorName"
          type="text"
          placeholder="Como o time vai te ver"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          maxLength={30}
        />
        {triedSubmit && !isCreatorNameValid && (
          <span className={styles.fieldError}>Informe seu nome.</span>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.scaleLabel}>Escala de pontos</span>
        <div className={styles.scales} role="radiogroup" aria-label="Escala de pontos">
          {SCALES.map((scale) => (
            <button
              type="button"
              key={scale}
              className={`${styles.pill} ${pointScale === scale ? styles.pillActive : ""}`}
              aria-pressed={pointScale === scale}
              onClick={() => setPointScale(scale)}
            >
              {POINT_SCALE_LABELS[scale]}
            </button>
          ))}
        </div>
        {triedSubmit && !isScaleValid && (
          <span className={styles.fieldError}>Escolha uma escala de pontos.</span>
        )}
      </div>

      {error && <p className={styles.generalError}>{error}</p>}

      <button
        type="submit"
        className={styles.cta}
        disabled={loading}
        aria-busy={loading}
        aria-label={loading ? "Criando sala" : undefined}
      >
        {loading ? <LoadingIcon size={28} /> : "Criar sala →"}
      </button>
      <p className={styles.helper}>
        Você recebe um link para convidar o time na próxima tela.
      </p>
    </form>
  );
}
