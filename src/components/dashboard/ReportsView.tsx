import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan'; 
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, TrendingUp, Calendar, DollarSign, Lock, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export default function ReportsView() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { plan } = usePlan(); 
  const [selectedMonth, setSelectedMonth] = useState('0');

  const dateRange = useMemo(() => {
    const today = new Date();
    const targetDate = subMonths(today, parseInt(selectedMonth));
    return {
      start: startOfMonth(targetDate),
      end: endOfMonth(targetDate),
      display: format(targetDate, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS })
    };
  }, [selectedMonth, i18n.language]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-reports', user?.id, selectedMonth],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      const businessId = member?.business_id;
      if (!businessId) return null;

      const { data, error } = await supabase
        .from('appointments')
        .select(`appointment_date, status, services ( name, price )`)
        .eq('business_id', businessId)
        .gte('appointment_date', dateRange.start.toISOString())
        .lte('appointment_date', dateRange.end.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && plan !== 'free' 
  });

  const stats = useMemo(() => {
    if (!reportData) return { revenue: 0, count: 0, ticket: 0, chartData: [], topServices: [] };

    let totalRevenue = 0;
    const serviceCount: Record<string, { count: number, value: number }> = {};
    const dailyRevenue: Record<string, number> = {};

    const daysInMonth = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    daysInMonth.forEach(day => {
      dailyRevenue[format(day, 'yyyy-MM-dd')] = 0;
    });

    reportData.forEach((app: any) => {
      const price = app.services?.price || 0;
      const serviceName = app.services?.name || 'Desconhecido';
      const dateKey = app.appointment_date;

      totalRevenue += price;
      if (dailyRevenue[dateKey] !== undefined) dailyRevenue[dateKey] += price;

      if (!serviceCount[serviceName]) serviceCount[serviceName] = { count: 0, value: 0 };
      serviceCount[serviceName].count += 1;
      serviceCount[serviceName].value += price;
    });

    const chartData = daysInMonth.map(day => ({
      name: format(day, 'dd'),
      fullDate: format(day, 'dd/MM'),
      value: dailyRevenue[format(day, 'yyyy-MM-dd')]
    }));

    const topServices = Object.entries(serviceCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      revenue: totalRevenue,
      count: reportData.length,
      ticket: reportData.length > 0 ? totalRevenue / reportData.length : 0,
      chartData,
      topServices
    };
  }, [reportData, dateRange]);

  const currencyFormatter = new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: i18n.language === 'pt' ? 'BRL' : 'USD'
  });

  if (plan === 'free') {
    return (
      <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900">
        <div className="absolute inset-0 filter blur-md opacity-30 p-8 grid gap-8 pointer-events-none">
           <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-slate-700 rounded-xl"></div>
              <div className="h-32 bg-slate-700 rounded-xl"></div>
              <div className="h-32 bg-slate-700 rounded-xl"></div>
           </div>
           <div className="h-64 bg-slate-700 rounded-xl"></div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 backdrop-blur-sm z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('dashboard.financial.locked_title', { defaultValue: 'Desbloqueie o Controle Financeiro' })}
          </h2>
          <p className="text-slate-400 max-w-md mb-8">
            {t('dashboard.financial.locked_desc', { defaultValue: 'Saiba exatamente quanto você ganha e quais serviços vendem mais com o Plano PRO.' })}
          </p>
          <Button 
            size="lg" 
            className="font-bold text-lg px-8 shadow-xl bg-primary hover:bg-primary/90 text-slate-900"
            onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('dashboard.banner.cta', { defaultValue: 'Ver Planos & Preços' })}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.reports.title', { defaultValue: 'Relatórios Financeiros' })}</h2>
          <p className="text-slate-400 capitalize">{dateRange.display}</p>
        </div>
        
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] bg-white text-slate-900 border-none">
            <Calendar className="w-4 h-4 mr-2 text-slate-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white text-slate-900">
            <SelectItem value="0" className="focus:bg-slate-100 cursor-pointer">{t('dashboard.reports.current_month', { defaultValue: 'Mês Atual' })}</SelectItem>
            <SelectItem value="1" className="focus:bg-slate-100 cursor-pointer">{t('dashboard.reports.last_month', { defaultValue: 'Mês Passado' })}</SelectItem>
            <SelectItem value="3" className="focus:bg-slate-100 cursor-pointer">{t('dashboard.reports.last_3_months', { defaultValue: 'Últimos 3 Meses' })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/90 to-primary/70 text-slate-900 border-0 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-slate-800 text-sm font-bold mb-1 opacity-80">{t('dashboard.reports.total_revenue', { defaultValue: 'Faturamento Total' })}</p>
          <h3 className="text-3xl font-extrabold">{currencyFormatter.format(stats.revenue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-900 bg-white/30 w-fit px-2 py-1 rounded-full font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{t('dashboard.reports.real_data', { defaultValue: 'Dados reais' })}</span>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800 border-white/10 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard.calendar.total', { defaultValue: 'Agendamentos' })}</p>
              <h3 className="text-2xl font-bold text-white">{stats.count}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800 border-white/10 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard.reports.ticket_avg', { defaultValue: 'Ticket Médio' })}</p>
              <h3 className="text-2xl font-bold text-white">{currencyFormatter.format(stats.ticket)}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-white/10 bg-slate-800 shadow-sm">
          <h4 className="font-bold text-white mb-6">{t('dashboard.reports.daily_revenue', { defaultValue: 'Receita Diária' })}</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                  itemStyle={{ color: '#3aed0d' }}
                  formatter={(value: number) => [currencyFormatter.format(value), t('dashboard.reports.revenue', {defaultValue: 'Receita'})]}
                  labelFormatter={(label) => `${t('common.day', {defaultValue: 'Dia'})} ${label}`}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f59e0b' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-white/10 bg-slate-800 shadow-sm">
          <h4 className="font-bold text-white mb-4">{t('dashboard.reports.top_services', { defaultValue: 'Top Serviços' })}</h4>
          <div className="space-y-4">
            {stats.topServices.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.reports.no_data', { defaultValue: 'Nenhum dado ainda.' })}</p>
            ) : (
              stats.topServices.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.count} {t('common.sales', { defaultValue: 'vendas' })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {currencyFormatter.format(service.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}