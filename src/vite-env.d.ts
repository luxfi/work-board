/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_BRAND?: string;
  readonly VITE_SHOW_STATUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
