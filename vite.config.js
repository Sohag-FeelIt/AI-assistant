import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
        overlay: resolve(__dirname, 'src/renderer/overlay.html'),
        settings: resolve(__dirname, 'src/renderer/settings.html')
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});