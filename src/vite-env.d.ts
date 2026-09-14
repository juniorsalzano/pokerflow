/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL da API real do PokerFlow (my-api). Ausente = usa o mock. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
