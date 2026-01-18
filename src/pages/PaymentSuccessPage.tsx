import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-slate-800 border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* Brilho de fundo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-primary to-green-400"></div>
        
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pagamento Recebido!</h1>
          <p className="text-slate-400">
            Sua assinatura foi confirmada com sucesso. <br/>
            Bem-vindo ao nível <span className="text-primary font-bold">Premium</span>.
          </p>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-sm text-slate-400">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-white">O que acontece agora?</span>
          </div>
          <p>Seu sistema será atualizado automaticamente em instantes. Você já pode acessar todos os recursos exclusivos.</p>
        </div>

        <Button 
          onClick={() => navigate('/dashboard')} 
          className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
        >
          Voltar ao Dashboard <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Card>
    </div>
  );
}