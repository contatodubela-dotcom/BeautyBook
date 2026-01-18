import { Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function SubscribeBanner() {
  const { user } = useAuth();

  const handleSubscribe = () => {
    if (!user) return;

    // SEU LINK DA STRIPE
    const baseUrl = "https://buy.stripe.com/test_8x2eVfb7rg1A93E6qa3gk00";

    // Adiciona o ID do usuário e o e-mail na URL
    // Isso garante que o Webhook saiba quem pagou!
    const checkoutUrl = `${baseUrl}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email || '')}`;

    window.open(checkoutUrl, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-violet-900 to-purple-800 rounded-2xl p-6 mb-8 text-white relative overflow-hidden shadow-xl border border-white/10">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Upgrade
            </span>
            <span className="text-purple-200 text-sm font-medium">Desbloqueie todo o potencial</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Passe para o Cleverya Pro 🚀</h2>
          <p className="text-purple-100 mb-4 max-w-lg">
            Tenha agendamentos ilimitados, lembretes automáticos no WhatsApp e relatórios financeiros completos.
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-purple-200">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Agenda Ilimitada</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Sem taxas ocultas</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 min-w-[200px]">
          <button 
            onClick={handleSubscribe}
            className="w-full bg-white text-purple-900 hover:bg-gray-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Assinar Agora
          </button>
          <span className="text-xs text-purple-300">Apenas R$ 29,90/mês</span>
        </div>
      </div>
    </div>
  );
}