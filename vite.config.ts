import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Cleverya - Gestão Inteligente',
        short_name: 'Cleverya',
        description: 'Seu tempo, organizado com inteligência.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- CONFIGURAÇÃO DE BUILD OTIMIZADA ---
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite do aviso para 1MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. Separa o React (Core)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // 2. Separa o Supabase (Pesado)
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // 3. Separa bibliotecas de Gráficos e Ícones (Pesados)
          if (id.includes('lucide') || id.includes('recharts') || id.includes('@radix-ui')) {
            return 'vendor-ui';
          }
        },
      },
    },
    cssCodeSplit: true, // Garante que o CSS seja dividido também
    minify: 'esbuild',
  },
});