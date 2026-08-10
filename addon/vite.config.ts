import { defineConfig } from 'vite';
import { resolve } from 'path';

const isDebug = process.env.DEBUG === '1';

export default defineConfig({
  build: {
    minify: isDebug ? false : undefined,
    sourcemap: isDebug ? 'inline' : undefined,
    outDir: 'dist',
    emptyDirFirst: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/tntConnectBackground.ts'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src')
    }
  }
});
