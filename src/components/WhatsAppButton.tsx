import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createMessage, openWhatsApp } from '../lib/whatsapp'; // Importa a inteligência nova

interface WhatsAppButtonProps {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  variant?: 'default' | 'icon' | 'outline';
}

export function WhatsAppButton({ 
  clientName, 
  clientPhone, 
  serviceName, 
  date, 
  time,
  variant = 'default' 
}: WhatsAppButtonProps) {
  const { t } = useTranslation();

  const handleSendMessage = () => {
    // Cria uma mensagem amigável de lembrete/contato
    const msg = createMessage('reminder', {
      clientName,
      serviceName,
      date,
      time
    });
    
    // Abre o WhatsApp
    openWhatsApp(clientPhone, msg);
  };

  if (variant === 'icon') {
    return (
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
        onClick={(e) => {
          e.stopPropagation(); // Impede que o clique abra o card do agendamento
          handleSendMessage();
        }}
        title={t('common.whatsapp', { defaultValue: 'Enviar WhatsApp' })}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button 
      onClick={(e) => {
        e.stopPropagation();
        handleSendMessage();
      }}
      className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp
    </Button>
  );
}