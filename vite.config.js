import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { chatPlugin } from './server/chat.mjs';

export default defineConfig({
  plugins: [react(), chatPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        faq: 'faq.html',
        extension: 'extension.html',
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    clearMocks: true,
  },
});
