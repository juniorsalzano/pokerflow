import { FormEvent, useState } from "react";
import { CriarSalaInput, EscalaPontos, ESCALAS_PONTOS_LABEL } from "../../types/room";
import styles from "./CreateRoomForm.module.css";

const ESCALAS: EscalaPontos[] = ["fibonacci", "sequencial", "camisetas"];

interface CreateRoomFormProps {
  onSubmit: (input: CriarSalaInput) => void;
  carregando?: boolean;
  erro?: string | null;
}

export default function CreateRoomForm({ onSubmit, carregando, erro }: CreateRoomFormProps) {
  const [nomeSala, setNomeSala] = useState("");
  const [nomeCriador, setNomeCriador] = useState("");
  const [escalaPontos, setEscalaPontos] = useState<EscalaPontos | null>(null);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const nomeSalaValido = nomeSala.trim().length > 0;
  const nomeCriadorValido = nomeCriador.trim().length > 0;
  const escalaValida = escalaPontos !== null;
  const formularioValido = nomeSalaValido && nomeCriadorValido && escalaValida;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTentouEnviar(true);
    if (!formularioValido || !escalaPontos) return;
    onSubmit({ nomeSala, nomeCriador, escalaPontos });
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>Nova sala</p>
      <h1 className={styles.title}>Crie sua sala de planning</h1>
      <p className={styles.subtitle}>
        Sem cadastro. Você entra como moderador assim que criar.
      </p>

      <div className={styles.field}>
        <label htmlFor="nomeSala">Nome da sala</label>
        <input
          id="nomeSala"
          type="text"
          placeholder="Ex: Refinamento Sprint 42"
          value={nomeSala}
          onChange={(e) => setNomeSala(e.target.value)}
          maxLength={60}
        />
        {tentouEnviar && !nomeSalaValido && (
          <span className={styles.erroCampo}>Informe um nome para a sala.</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="nomeCriador">Seu nome</label>
        <input
          id="nomeCriador"
          type="text"
          placeholder="Como o time vai te ver"
          value={nomeCriador}
          onChange={(e) => setNomeCriador(e.target.value)}
          maxLength={30}
        />
        {tentouEnviar && !nomeCriadorValido && (
          <span className={styles.erroCampo}>Informe seu nome.</span>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.labelEscala}>Escala de pontos</span>
        <div className={styles.escalas} role="radiogroup" aria-label="Escala de pontos">
          {ESCALAS.map((escala) => (
            <button
              type="button"
              key={escala}
              className={`${styles.pill} ${escalaPontos === escala ? styles.pillActive : ""}`}
              aria-pressed={escalaPontos === escala}
              onClick={() => setEscalaPontos(escala)}
            >
              {ESCALAS_PONTOS_LABEL[escala]}
            </button>
          ))}
        </div>
        {tentouEnviar && !escalaValida && (
          <span className={styles.erroCampo}>Escolha uma escala de pontos.</span>
        )}
      </div>

      {erro && <p className={styles.erroGeral}>{erro}</p>}

      <button type="submit" className={styles.cta} disabled={carregando}>
        {carregando ? "Criando..." : "Criar sala →"}
      </button>
      <p className={styles.helper}>
        Você recebe um link para convidar o time na próxima tela.
      </p>
    </form>
  );
}
