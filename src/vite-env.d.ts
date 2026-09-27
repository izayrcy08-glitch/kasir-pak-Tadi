/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** SEMENTARA: "true" = build APK uji yang langsung membuka halaman /uji-db. */
  readonly VITE_UJI_DB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
