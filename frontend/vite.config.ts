import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Required for Docker volume hot-reload on Windows/macOS
    },
  },
  build: {
    lib: {
      entry: 'src/widget.ts',
      name: 'ChatbotWidget',
      fileName: 'chatbot',
      formats: ['iife'],
    },
    outDir: 'dist',
  },
});
