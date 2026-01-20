import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n'; // Importante para as traduções
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'sonner'; // Importante para os alertas visuais
import posthog from 'posthog-js';

// --- CONFIGURAÇÃO DO POSTHOG (ANALYTICS) ---
// ⚠️ IMPORTANTE: Substitua 'phc_SUA_CHAVE_AQUI' pela sua Project API Key do PostHog
posthog.init('phc_xZtmAqykzTZZPmzIGL7ODp3nLbhsgKcwLIolcowrOb8', {
  api_host: 'https://us.i.posthog.com', // Use 'https://eu.i.posthog.com' se escolheu servidor na Europa
  person_profiles: 'identified_only', 
  capture_pageview: false // O React gerencia as rotas, deixamos como false para evitar duplicidade
});

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* O AuthProvider fornece o usuário para toda a aplicação */}
      <AuthProvider>
        <App />
        {/* O Toaster fica aqui para garantir que os alertas apareçam sempre no topo */}
        <Toaster richColors position="top-center" closeButton />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);