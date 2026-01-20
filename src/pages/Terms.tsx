import { Link } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.language === 'pt';

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="flex items-center gap-4 mb-12">
          <Link to="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white pl-0 gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('common.back', {defaultValue: 'Voltar'})}
            </Button>
          </Link>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
               <ScrollText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('legal.terms_title')}</h1>
          </div>

          <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base">
            <p><strong>{t('legal.last_updated')}:</strong> {new Date().toLocaleDateString(isPt ? 'pt-BR' : 'en-US')}</p>

            {isPt ? (
              // TEXTO EM PORTUGUÊS
              <>
                <p>Ao acessar e usar o Cleverya ("Plataforma"), você aceita e concorda com estes termos.</p>
                <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Aceitação</h2>
                <p>Se você não concordar com estes termos, não use nossos serviços.</p>
                <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Serviços</h2>
                <p>O Cleverya é uma plataforma de agendamento. Reservamos o direito de modificar o serviço a qualquer momento.</p>
                {/* ... (O resto do seu texto em PT aqui) ... */}
                <p>Para ler o texto completo, consulte a versão original em Português ou entre em contato.</p>
              </>
            ) : (
              // TEXTO EM INGLÊS (Resumido para o exemplo, você pode colar o completo aqui)
              <>
                <p>By accessing and using Cleverya ("Platform"), you accept and agree to be bound by these terms.</p>
                <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance</h2>
                <p>If you do not agree to these terms, do not use our services.</p>
                <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Services</h2>
                <p>Cleverya is a booking platform. We reserve the right to modify the service at any time.</p>
                <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Payments</h2>
                <p>Payments are processed securely via Stripe. Subscriptions renew automatically unless cancelled.</p>
                <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Cancellation</h2>
                <p>You may cancel your subscription at any time via the dashboard.</p>
              </>
            )}

            <div className="bg-slate-800/50 border border-white/5 rounded-lg p-4 mt-8">
              <p><strong>{t('legal.support_email')}:</strong> contato@cleverya.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}