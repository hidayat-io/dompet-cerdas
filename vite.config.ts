import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const manualChunks = (id: string) => {
    if (!id.includes('node_modules')) return undefined;

    if (id.includes('exceljs')) return 'exceljs';
    if (id.includes('firebase/storage') || id.includes('@firebase/storage')) return 'firebase-storage';
    if (id.includes('firebase/functions') || id.includes('@firebase/functions')) return 'firebase-functions';
    if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) return 'firebase-firestore';
    if (id.includes('firebase/auth') || id.includes('@firebase/auth')) return 'firebase-auth';
    if (id.includes('firebase/app') || id.includes('@firebase/app')) return 'firebase-core';
    if (id.includes('firebase')) return 'firebase';
    if (id.includes('@mui/material') || id.includes('@emotion/')) return 'mui-core';
    if (id.includes('recharts')) return 'charts';
    if (id.includes('react-markdown')) return 'markdown';
    if (id.includes('react/') || id.includes('/react-dom/')) return 'react-core';

    return undefined;
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks,
        }
      },
      // Generate source maps for debugging
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    }
  };
});
