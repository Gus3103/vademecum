import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@drug-medicine-lookup/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  // Tell Vite where to find packages in the monorepo root
  server: {
    fs: {
      allow: ['../..'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
