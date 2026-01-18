import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import LandingPage from './pages/LandingPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/success" element={
  <ProtectedRoute>
    <PaymentSuccessPage />
  </ProtectedRoute>
} />

          {/* Rota Antiga (Mantém funcionando) */}
          <Route path="/book/:userId" element={<BookingPage />} />
          
          {/* NOVA ROTA: Personalizada (Deve ficar por último) */}
          <Route path="/:slug" element={<BookingPage />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;