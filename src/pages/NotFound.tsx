import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center selection:bg-primary selection:text-slate-900">
      
      {/* Ícone Animado */}
      <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(250,204,21,0.1)] animate-pulse">
        <AlertTriangle className="w-12 h-12 text-primary" />
      </div>

      <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tighter">
        {t('not_found.title', {defaultValue: '404'})}
      </h1>
      
      <h2 className="text-xl md:text-2xl font-medium text-gray-300 mb-6">
        {t('not_found.subtitle', {defaultValue: 'Página não encontrada'})}
      </h2>
      
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        {t('not_found.desc', {defaultValue: 'Ops! O link que você tentou acessar não existe.'})}
      </p>

      <Link to="/">
        <Button className="bg-primary hover:bg-primary/90 text-slate-950 font-bold px-8 py-6 rounded-xl flex items-center gap-2 transition-all hover:scale-105">
          <Home className="w-5 h-5" />
          {t('not_found.btn_home', {defaultValue: 'Voltar para o Início'})}
        </Button>
      </Link>
    </div>
  );
}