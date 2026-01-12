import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  // Função para criar o link amigável (Slug)
  // Ex: "Salão da Maria" vira "salao-da-maria"
  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // Separa acentos
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-') // Espaços viram hífens
      .replace(/[^\w-]+/g, '') // Remove caracteres especiais
      .replace(/--+/g, '-') // Remove hífens duplicados
      .replace(/^-+/, '') // Remove hífen do começo
      .replace(/-+$/, ''); // Remove hífen do fim
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = generateSlug(businessName);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            business_name: businessName, // Salva o nome oficial
            slug: slug // Salva o link personalizado
          } 
        },
      });

      if (error) throw error;
      setSuccess(true);
      toast.success(i18n.language === 'pt' ? 'Cadastro iniciado!' : 'Sign up started!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t('auth.error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
       {/* Background Glow */}
       <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

       {/* Botão de Idioma */}
       <div className="absolute top-4 right-4 z-20">
         <button onClick={toggleLanguage} className="text-white/50 hover:text-white text-sm font-bold border border-white/10 rounded-lg px-3 py-1.5 transition">
            {i18n.language === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
         </button>
       </div>

      <div className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {!success && (
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-white text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back_home')}
            </Link>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-sans font-bold text-white mb-2">
            {t('auth.signup_title')}
          </h1>
          <p className="text-gray-400 text-sm">{t('auth.signup_subtitle')}</p>
        </div>

        {success ? (
          <div className="text-center animate-fade-in py-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-xl text-white mb-2">{t('auth.signup_success_title')}</h3>
            <p className="text-sm text-gray-400 mb-6">
              {t('auth.signup_success_msg')} <br/><strong className="text-white">{email}</strong>.
            </p>
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5" onClick={() => navigate('/login')}>
              {t('auth.btn_back_login')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">{t('auth.label_business')}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={t('auth.placeholder_business')}
                required
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
              {/* Mostra uma prévia do link para o usuário */}
              {businessName && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Seu link será: <strong>beautybook.app/{generateSlug(businessName)}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">{t('auth.label_email')}</label>
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
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">{t('auth.label_password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.placeholder_password')}
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
              {loading ? t('auth.btn_loading') : t('auth.btn_signup')}
            </Button>

            <p className="text-center mt-6 text-sm text-gray-500">
              {t('auth.link_have_account').split('?')[0]}?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-white transition-colors">
                {t('auth.btn_login')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}