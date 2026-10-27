import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['@cms/shared'] },
  build: { commonjsOptions: { include: [/shared/, /node_modules/] } },
});
