import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Bell,
  User as UserIcon
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    confirmedCount: 0,
    noShowCount: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);

  // Locale dinâmico para datas
  const dateLocale = i18n.language === 'en' ? enUS : ptBR;

  const fetchData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: allAppointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients (name, phone),
          services (name, duration_minutes),
          professionals (name)
        `)
        .eq('user_id', user?.id)
        .or(`appointment_date.eq.${today},status.eq.pending`)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      const todays = allAppointments?.filter(a => a.appointment_date === today) || [];
      const pendings = allAppointments?.filter(a => a.status === 'pending') || [];

      setTodayAppointments(todays);
      setPendingAppointments(pendings);

      setStats({
        todayCount: todays.length,
        weekCount: allAppointments?.length || 0,
        confirmedCount: todays.filter(a => a.status === 'confirmed').length,
        noShowCount: todays.filter(a => a.status === 'no_show').length
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(t('common.update') + '!');
      fetchData();
    } catch (error) {
      toast.error(t('auth.error_generic'));
    }
  };

  const handleReschedule = (phone: string, clientName: string) => {
    if (!phone) {
      toast.error('Cliente sem telefone');
      return;
    }
    const message = i18n.language === 'pt' 
        ? `Oi ${clientName}, precisamos reagendar seu horário. Qual a melhor data para você?`
        : `Hi ${clientName}, we need to reschedule your appointment. What date works best for you?`;
    
    const url = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 bg-card border border-white/5 border-l-4 border-l-primary shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.overview.today')}</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.todayCount}</div>
        </Card>
        
        <Card className="p-4 space-y-2 bg-card border border-white/5 border-l-4 border-l-yellow-500 shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.overview.pending')}</span>
            <Bell className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-yellow-500">{pendingAppointments.length}</div>
        </Card>

        <Card className="p-4 space-y-2 bg-card border border-white/5 border-l-4 border-l-green-500 shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.overview.confirmed')}</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.confirmedCount}</div>
        </Card>

        <Card className="p-4 space-y-2 bg-card border border-white/5 border-l-4 border-l-red-500 shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.overview.noshow')}</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.noShowCount}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* COLUNA 1: SOLICITAÇÕES PENDENTES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-yellow-500" />
              {t('dashboard.overview.title_pending')}
            </h2>
            {pendingAppointments.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full border border-yellow-500/30">
                {pendingAppointments.length} {t('dashboard.overview.new_badge')}
              </span>
            )}
          </div>

          {pendingAppointments.length === 0 ? (
            <Card className="p-8 text-center bg-card border border-dashed border-white/10 rounded-xl">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500/20" />
              <p className="text-sm text-gray-400">{t('dashboard.overview.no_pending')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingAppointments.map((app) => (
                <Card key={app.id} className="p-4 border-l-4 border-l-yellow-500 bg-card border-y border-r border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{app.clients?.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span className="capitalize">
                          {format(parseISO(app.appointment_date), "EEE, dd MMM", { locale: dateLocale })}
                        </span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{app.appointment_time.slice(0, 5)}</span>
                      </div>
                      <p className="text-sm font-medium text-primary mt-1">
                        {app.services?.name}
                        {app.professionals?.name && (
                            <span className="text-gray-400 font-normal ml-1">
                                / {app.professionals.name.split(' ')[0]}
                            </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white border-0"
                      onClick={() => updateStatus(app.id, 'confirmed')}
                    >
                      {t('dashboard.overview.btn_confirm')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full text-red-400 border-red-900/30 hover:bg-red-950/30 hover:text-red-300"
                      onClick={() => handleReschedule(app.clients?.phone, app.clients?.name)}
                    >
                      {t('dashboard.overview.btn_reschedule')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA 2: AGENDA DE HOJE */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-primary" />
            {t('dashboard.overview.title_today')}
          </h2>

          {todayAppointments.length === 0 ? (
            <Card className="p-8 text-center bg-card border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-gray-400">{t('dashboard.overview.no_today')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((app) => (
                <Card key={app.id} className={`p-4 border-l-4 bg-card border-y border-r border-white/5 ${
                  app.status === 'confirmed' ? 'border-l-green-500' : 
                  app.status === 'no_show' ? 'border-l-red-500' :
                  app.status === 'completed' ? 'border-l-blue-500' :
                  'border-l-gray-600'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[3.5rem] p-2 rounded bg-white/5">
                      <span className="block text-lg font-bold font-mono text-white">
                        {app.appointment_time.slice(0, 5)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{app.clients?.name}</h3>
                        {app.status === 'confirmed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-400 flex flex-col sm:flex-row sm:gap-1">
                        <span>{app.services?.name}</span>
                        {app.professionals?.name && (
                            <span className="text-primary flex items-center gap-1">
                                <span className="hidden sm:inline">•</span> 
                                <UserIcon className="w-3 h-3" />
                                {app.professionals.name.split(' ')[0]}
                            </span>
                        )}
                      </p>
                    </div>

                    {app.status === 'confirmed' && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t('dashboard.overview.status_noshow')}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => updateStatus(app.id, 'no_show')}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Concluir"
                          className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => updateStatus(app.id, 'completed')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}