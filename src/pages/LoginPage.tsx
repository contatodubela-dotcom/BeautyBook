import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate já estava aqui, vamos usá-lo
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { } = useAuth(); 
  const navigate = useNavigate(); // Hook de navegação
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Tenta fazer o login no Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. SUCESSO! Força a ida para o Dashboard imediatamente
      // Se quiser exibir um aviso antes, pode descomentar a linha abaixo:
      // toast.success('Login realizado com sucesso!');
      navigate('/dashboard'); 
      
    } catch (error: any) {
      console.error(error);
      // Mensagem de erro amigável
      const msg = error.message === 'Invalid login credentials' 
        ? (i18n.language === 'pt' ? 'Email ou senha incorretos.' : 'Invalid email or password.')
        : (error.message || t('auth.error_generic'));
      
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Botão de Idioma */}
      <div className="absolute top-4 right-4 z-20">
         <button onClick={toggleLanguage} className="text-white/50 hover:text-white text-sm font-bold border border-white/10 rounded-lg px-3 py-1.5 transition">
            {i18n.language === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
         </button>
      </div>

      <div className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back_home')}
        </Link>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="bg-gradient-to-tr from-amber-400 to-orange-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 text-white" />
             </div>
          </div>
          <h1 className="text-2xl font-sans font-bold text-white mb-2">{t('auth.login_title')}</h1>
          <p className="text-slate-400 text-sm">{t('auth.login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">{t('auth.label_email')}</label>
              <Input 
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0f172a] border-0 border-b border-slate-700 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-0 transition-all py-2"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">{t('auth.label_password')}</label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0f172a] border-0 border-b border-slate-700 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-0 transition-all py-2"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold h-11 rounded-lg mt-2"
              disabled={loading}
            >
              {loading ? t('auth.btn_loading') : t('auth.btn_login')}
            </Button>
        </form>

        <div className="mt-6 text-center">
            <Link to="/signup" className="text-sm text-primary hover:text-white transition-colors">
              {t('auth.link_no_account')}
            </Link>
        </div>
      </div>
    </div>
  );
}