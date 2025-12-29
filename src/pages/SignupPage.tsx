import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) throw error;
      setSuccess(true);
      toast.success('Cadastro iniciado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
       {/* Background Glow */}
       <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {!success && (
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-white text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Home
            </Link>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-sans font-bold text-white mb-2">
            Comece Gratuitamente
          </h1>
          <p className="text-gray-400 text-sm">Organize sua agenda e fature mais.</p>
        </div>

        {success ? (
          <div className="text-center animate-fade-in py-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-xl text-white mb-2">Verifique seu Email</h3>
            <p className="text-sm text-gray-400 mb-6">
              Enviamos um link de confirmação para <br/><strong className="text-white">{email}</strong>.
            </p>
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5" onClick={() => navigate('/login')}>
              Voltar para Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Nome do Negócio</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Estúdio Bella"
                required
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold h-11 rounded-lg mt-2"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <p className="text-center mt-6 text-sm text-gray-500">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-white transition-colors">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}