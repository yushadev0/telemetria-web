import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
// Prod'da uygulama https://yusa.app/telemetria/ altında sunulur → base o yola sabitlenir.
// mode: dev = 'development' (base '/'), build + preview = 'production' (base '/telemetria/').
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/telemetria/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
