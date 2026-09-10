/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API tabanı. Boş = same-origin relative istekler. Örn dev: `http://127.0.0.1:8000` */
  readonly VITE_API_BASE_URL: string;
  /** WebSocket tabanı. Boş = window.location'dan türetilir. Örn dev: `ws://127.0.0.1:8000` */
  readonly VITE_WS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
