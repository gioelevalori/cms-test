import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pubblicata su GitHub Pages in /<nome-repo>/
export default defineConfig({
  base: process.env.DEMO_BASE ?? '/cms-test/',
  plugins: [react()],
  optimizeDeps: { include: ['@cms/shared'] },
  build: { commonjsOptions: { include: [/shared/, /node_modules/] } },
});
