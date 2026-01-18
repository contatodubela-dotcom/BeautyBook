import { useAuth } from '../hooks/useAuth'; // Ajuste o caminho se necessário

export function SubscribeButton() {
  const { user } = useAuth();

  // Seu link original da Stripe
  const STRIPE_LINK = "https://buy.stripe.com/8x2eVfb7rg1A93E6qa3gk00";

  const handleSubscribe = () => {
    if (!user) return;

    // TRUQUE DE MESTRE:
    // Adicionamos ?client_reference_id=ID_DO_USUARIO ao final do link.
    // Assim, quando o pagamento cair, a Stripe sabe exatamente quem pagou.
    // Também preenchemos o e-mail automaticamente para facilitar.
    
    const smartLink = `${STRIPE_LINK}?client_reference_id=${user.id}&prefilled_email=${user.email}`;
    
    // Abre em nova aba
    window.open(smartLink, '_blank');
  };

  return (
    <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center">
      <h3 className="text-lg font-bold text-purple-900">Faça o Upgrade para o Cleverya Pro</h3>
      <p className="text-sm text-purple-700 mb-4">
        Agendamentos ilimitados e gestão completa por apenas R$ 29,90/mês.
      </p>
      
      <button
        onClick={handleSubscribe}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200 shadow-md"
      >
        Assinar Agora 🚀
      </button>
      
      <p className="text-xs text-gray-500 mt-2">
        Ambiente seguro via Stripe
      </p>
    </div>
  );
}