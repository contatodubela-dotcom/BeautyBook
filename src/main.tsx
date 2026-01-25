import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'sonner';
import posthog from 'posthog-js';
import { HelmetProvider } from 'react-helmet-async';
import ReactGA from "react-ga4"; // <--- Import da biblioteca

// Configuração do PostHog
posthog.init('phc_xZtmAqykzTZZPmzIGL7ODp3nLbhsgKcwLIolcowrOb8', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only', 
  capture_pageview: false 
});

// --- GOOGLE ANALYTICS ---
// ✅ Use APENAS o ID aqui. A biblioteca faz o resto.
ReactGA.initialize("G-8ZJYEN9K17"); 

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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);