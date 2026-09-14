import CreateRoomForm from "../components/CreateRoomForm/CreateRoomForm";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import { useCreateRoom } from "../hooks/useCreateRoom";
import styles from "./CreateRoomPage.module.css";

export default function CreateRoomPage() {
  const { criarSala, erro, carregando } = useCreateRoom();

  return (
    <div className={styles.stage}>
      <div className={styles.brand}>
        <svg width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect
            x="18"
            y="12"
            width="28"
            height="40"
            rx="7"
            transform="rotate(7 32 32)"
            fill="var(--accent-a)"
          />
        </svg>
        <span className={styles.brandWord}>
          Poker<span className={styles.gradText}>Flow</span>
        </span>
      </div>
      <div className={styles.toggleSlot}>
        <ThemeToggle />
      </div>
      <CreateRoomForm onSubmit={criarSala} erro={erro} carregando={carregando} />
    </div>
  );
}
