import { defineConfig } from 'vite';
import { resolve } from 'path';

const isDebug = process.env.DEBUG === '1';

export default defineConfig({
  build: {
    minify: isDebug ? false : undefined,
    sourcemap: isDebug ? 'inline' : undefined,
    outDir: 'dist',
    rollupOptions: {
      input: {
        tntConnectBackground: resolve(__dirname, 'src/tntConnectBackground.ts'),
        options: resolve(__dirname, 'src/options.ts')
      },
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
