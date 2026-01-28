import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { SEO } from './components/SEO';
import { GoogleAnalyticsTracker } from './components/GoogleAnalyticsTracker';

// --- LAZY LOADING (Otimização de Performance) ---
// Transforma os imports estáticos em dinâmicos.
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BookingPage = lazy(() => import('./pages/BookingPage')); // Crítico para o cliente final
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Componente de Carregamento Simples (Aparece enquanto a página baixa)
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Componente de Rota Protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      {/* O Suspense gerencia o carregamento das páginas lazy */}
      <Suspense fallback={<LoadingScreen />}>
        <SEO /> 
        <GoogleAnalyticsTracker />
        <Routes>
          {/* Páginas Públicas - Leves */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* O Link de Agendamento (Separado do Painel) */}
          <Route path="/book/:userId" element={<BookingPage />} />
          <Route path="/:slug" element={<BookingPage />} />

          {/* Área Logada (Só carrega se fizer login) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/success" element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;