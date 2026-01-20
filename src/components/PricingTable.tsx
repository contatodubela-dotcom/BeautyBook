import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth'; 

export function PricingTable() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth(); // Pega o usuário logado
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const isBRL = i18n.language?.startsWith('pt');
  const currency = isBRL ? 'R$' : '$';

  const plans = [
    {
      name: 'Pro',
      id: 'pro', // Identificador para a URL
      description: isBRL ? 'Para profissionais independentes em crescimento.' : 'For growing independent professionals.',
      price: {
        monthly: isBRL ? '29,90' : '9.90',
        yearly: isBRL ? '269,10' : '89.10',
      },
      // Links diretos para quando o usuário JÁ está logado
      links: {
        monthly: isBRL 
          ? 'https://buy.stripe.com/test_8x2eVfb7rg1A93E6qa3gk00' 
          : 'https://buy.stripe.com/test_8x2bJ36RbaHgdjUbKu3gk01',
        yearly: isBRL 
          ? 'https://buy.stripe.com/test_4gM5kFcbvg1AdjU5m63gk04' 
          : 'https://buy.stripe.com/test_dRm8wR0sNaHg6Vw15Q3gk05',
      },
      features: [
        isBRL ? 'Agendamentos ilimitados' : 'Unlimited appointments',
        isBRL ? 'Até 3 profissionais' : 'Up to 3 professionals',
        isBRL ? 'Relatórios básicos' : 'Basic reports',
        isBRL ? 'Sem marca d\'água' : 'No watermark',
      ],
      popular: true,
      icon: Sparkles,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
    },
    {
      name: 'Business',
      id: 'business', // Identificador para a URL
      description: isBRL ? 'Para clínicas e estabelecimentos maiores.' : 'For clinics and larger establishments.',
      price: {
        monthly: isBRL ? '59,90' : '19.90',
        yearly: isBRL ? '539,10' : '179.10',
      },
      links: {
        monthly: isBRL 
          ? 'https://buy.stripe.com/test_dRm6oJ6Rb2aK1Bcg0K3gk03' 
          : 'https://buy.stripe.com/test_fZueVfejD8z82FgcOy3gk02',
        yearly: isBRL 
          ? 'https://buy.stripe.com/test_cNi6oJ4J34iS93EaGq3gk07' 
          : 'https://buy.stripe.com/test_eVqaEZdfz8z80x8dSC3gk06',
      },
      features: [
        isBRL ? 'Tudo do Pro' : 'Everything in Pro',
        isBRL ? 'Profissionais ilimitados' : 'Unlimited professionals',
        isBRL ? 'Gestão multi-unidade' : 'Multi-unit management',
        isBRL ? 'Exportação de dados' : 'Data export',
        isBRL ? 'Suporte prioritário' : 'Priority support',
      ],
      popular: false,
      icon: Building2,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="flex justify-center mb-8">
        <div className="bg-slate-800/50 p-1 rounded-xl inline-flex relative border border-white/5">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative z-10",
              billingCycle === 'monthly' ? "text-white font-bold" : "text-slate-400 hover:text-white"
            )}
          >
            {isBRL ? 'Mensal' : 'Monthly'}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative z-10",
              billingCycle === 'yearly' ? "text-white font-bold" : "text-slate-400 hover:text-white"
            )}
          >
            {isBRL ? 'Anual' : 'Yearly'}
            <span className="absolute -top-3 -right-6 bg-green-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg">
              -25%
            </span>
          </button>
          
          <div 
            className={cn(
              "absolute top-1 bottom-1 w-[50%] bg-primary rounded-lg transition-all duration-300 shadow-lg",
              billingCycle === 'monthly' ? "left-1" : "left-[49%]"
            )}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
          
          // Link direto do Stripe (caso já esteja logado)
          const rawLink = billingCycle === 'monthly' ? plan.links.monthly : plan.links.yearly;
          
          // Lógica Inteligente de Redirecionamento
          let actionUrl;

          if (user?.id) {
             // 1. Usuário LOGADO: Vai direto para o Stripe com o ID dele
             actionUrl = `${rawLink}?client_reference_id=${user.id}&prefilled_email=${user.email}`;
          } else {
             // 2. Usuário NÃO LOGADO: Vai para o cadastro levando o plano e o ciclo na URL
             actionUrl = `/signup?plan=${plan.id}&cycle=${billingCycle}`;
          }

          return (
            <div 
              key={plan.name}
              className={cn(
                "relative bg-slate-800/40 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-slate-800/60",
                plan.popular ? "border-primary shadow-[0_0_30px_rgba(246,173,85,0.15)]" : "border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-slate-900" />
                  {isBRL ? 'Mais Popular' : 'Most Popular'}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={cn("p-3 rounded-xl bg-opacity-20 border border-white/5", plan.color)}>
                  <Icon className={cn("w-6 h-6", plan.textColor)} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>
              </div>

              <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-end gap-1">
                  <span className="text-lg font-medium text-slate-400 mb-1">{currency}</span>
                  <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                  <span className="text-slate-500 mb-1 text-sm font-medium">
                    /{billingCycle === 'monthly' ? (isBRL ? 'mês' : 'mo') : (isBRL ? 'ano' : 'yr')}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-slate-700/50 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <a 
                href={actionUrl}
                // Se for link do Stripe (começa com http), abre nova aba. Se for rota interna (/signup), mesma aba.
                target={user?.id ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button 
                  className={cn(
                    "w-full font-bold h-12 text-base transition-all rounded-xl shadow-lg",
                    plan.popular 
                      ? "bg-primary text-slate-900 hover:bg-primary/90 hover:scale-[1.02]" 
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  )}
                >
                  {isBRL ? 'Começar Agora' : 'Get Started'}
                </Button>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}