import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import { useAuth } from './hooks/useAuth';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Componente de Rota Protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
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
    // QueryClientProvider e Toaster removidos daqui pois já estão no main.tsx
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
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
        
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Rota Antiga */}
        <Route path="/book/:userId" element={<BookingPage />} />
        
        {/* Rota Slug Personalizada */}
        <Route path="/:slug" element={<BookingPage />} />

        {/* Rota 404 - SEMPRE POR ÚLTIMO */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;