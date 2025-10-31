import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
      'Access-Control-Allow-Credentials': 'true',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Content-Security-Policy':
        "default-src 'self'; connect-src 'self' http://localhost:3001 ws://localhost:3001 wss://localhost:3001 https://*.railway.app wss://*.railway.app https://discord.com https://*.discord.com https://vitals.vercel-insights.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'self' https://discord.com https://*.discord.com"
    },
    cors: true,
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true
    },
  },
  optimizeDeps: {
    include: ['@discord/embedded-app-sdk'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('wordlist')) {
            return 'wordlist';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  }
});
