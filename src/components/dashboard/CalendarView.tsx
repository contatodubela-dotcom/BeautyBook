import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock, User, CheckCircle, XCircle, MessageCircle, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { createMessage, openWhatsApp } from '../../lib/whatsapp';

function RangeCalendar({ 
  startDate, endDate, onStartChange, onEndChange, onQuickSelect 
}: any) {
  const { t } = useTranslation();
  return (
    <div className="p-4 bg-[#1e293b] rounded-xl border border-white/10 shadow-sm space-y-4">
      <div className="flex gap-2 mb-2">
        <Button variant="outline" size="sm" className="flex-1 border-white/20 text-gray-300 hover:text-white hover:bg-white/10" onClick={() => onQuickSelect('today')}>{t('dashboard.calendar.today', { defaultValue: 'Hoje' })}</Button>
        <Button variant="outline" size="sm" className="flex-1 border-white/20 text-gray-300 hover:text-white hover:bg-white/10" onClick={() => onQuickSelect('week')}>{t('dashboard.calendar.week', { defaultValue: 'Semana' })}</Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">{t('common.from')}</label>
          <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className="w-full p-2 border border-white/10 bg-black/20 rounded-md text-center text-sm text-white outline-none focus:ring-2 ring-primary/20 [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">{t('common.to')}</label>
          <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className="w-full p-2 border border-white/10 bg-black/20 rounded-md text-center text-sm text-white outline-none focus:ring-2 ring-primary/20 [color-scheme:dark]" />
        </div>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'));
  const dateLocale = i18n.language === 'en' ? enUS : ptBR;

  // 1. Busca nome da empresa para assinar a mensagem
  const { data: businessName } = useQuery({
    queryKey: ['biz-name', user?.id],
    queryFn: async () => {
        const { data } = await supabase.from('businesses').select('name').eq('owner_id', user?.id).single();
        return data?.name;
    }
  });

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['appointments-list', user?.id, startDate, endDate],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      const businessId = member?.business_id;
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (name, phone),
          services (name, duration_minutes, price),
          professionals (name)
        `)
        .eq('business_id', businessId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleQuickSelect = (type: 'today' | 'week') => {
    const today = new Date();
    if (type === 'today') {
      const f = format(today, 'yyyy-MM-dd');
      setStartDate(f); setEndDate(f);
    } else {
      setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'));
    }
  };

  const handleConfirm = async (app: any) => {
    // 1. Atualiza no banco
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', app.id);
    toast.success(t('toasts.confirmed'));
    refetch();

    // 2. Monta a mensagem
    const message = createMessage('confirm', {
        clientName: app.clients?.name,
        serviceName: app.services?.name,
        professionalName: app.professionals?.name,
        date: app.appointment_date,
        time: app.appointment_time,
        businessName: businessName
    });

    // 3. Pergunta se quer enviar
    if (confirm(t('toasts.whatsapp_confirm', { name: app.clients?.name }))) {
        openWhatsApp(app.clients?.phone, message);
    }
  };

  const handleCancel = async (app: any) => {
    if(!confirm(t('toasts.confirm_cancel_app'))) return;
    
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', app.id);
    toast.info(t('toasts.cancelled'));
    refetch();
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6 animate-in fade-in">
      <div className="space-y-4">
        <RangeCalendar startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onQuickSelect={handleQuickSelect} />
        
        <Card className="p-4 bg-[#1e293b] border-white/10 text-white">
          <h3 className="font-semibold text-primary mb-2">{t('dashboard.calendar.summary')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">{t('dashboard.calendar.total')}:</span><span className="font-bold">{appointments?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('dashboard.calendar.pending')}:</span><span className="font-bold text-yellow-500">{appointments?.filter((a:any) => a.status === 'pending').length}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('dashboard.calendar.confirmed')}:</span><span className="font-bold text-green-500">{appointments?.filter((a:any) => a.status === 'confirmed').length}</span></div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t('dashboard.calendar.title')}</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10">{t('dashboard.calendar.refresh')}</Button>
        </div>

        {appointments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-[#1e293b] rounded-xl border border-dashed border-white/10">
            <CalendarIcon className="w-16 h-16 mb-4 text-gray-500 opacity-50" />
            <p className="text-lg font-medium">{t('dashboard.calendar.no_appointments')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments?.map((app: any) => (
              <Card key={app.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-white/5 transition-all bg-[#1e293b] border-white/10">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-black/30 rounded-lg min-w-[90px] text-center border border-white/5">
                    <span className="text-xs font-bold uppercase text-gray-400">{format(parseISO(app.appointment_date), 'dd MMM', { locale: dateLocale })}</span>
                    <span className="text-xl font-bold text-white">{app.appointment_time?.slice(0, 5)}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 ${app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' : app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{app.status}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{app.clients?.name || 'Cliente deletado'}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {app.services?.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded text-xs"><User className="w-3 h-3" /> {app.professionals?.name}</span>
                    </div>
                  </div>
                </div>
                
                {/* AÇÕES */}
                <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t border-white/10 md:border-t-0 mt-2 md:mt-0">
                  
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-green-400 hover:bg-green-900/20"
                    title="Enviar mensagem"
                    onClick={() => {
                        const msg = createMessage('reminder', {
                            clientName: app.clients?.name,
                            serviceName: app.services?.name,
                            date: app.appointment_date,
                            time: app.appointment_time
                        });
                        openWhatsApp(app.clients?.phone, msg);
                    }}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>

                  {app.status === 'pending' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirm(app)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> {t('dashboard.overview.btn_confirm')}
                    </Button>
                  )}
                  
                  {['pending', 'confirmed'].includes(app.status) && (
                    <Button size="sm" variant="outline" className="text-red-400 hover:bg-red-950/30 border-red-900/50" onClick={() => handleCancel(app)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}