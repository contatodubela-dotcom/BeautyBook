import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Printer, Download, Filter, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ReportItem {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name: string;
  service_name: string;
  professional_name: string;
  price: number;
}

export default function ReportsView() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportItem[]>([]);
  
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const [viewMode, setViewMode] = useState<'all' | 'realized' | 'forecast'>('all');

  const realizedRevenue = data
    .filter(item => item.status === 'completed')
    .reduce((acc, item) => acc + (item.price || 0), 0);

  const forecastRevenue = data
    .filter(item => item.status === 'confirmed' || item.status === 'pending')
    .reduce((acc, item) => acc + (item.price || 0), 0);

  const completedCount = data.filter(item => item.status === 'completed').length;

  const filteredData = data.filter(item => {
    if (viewMode === 'realized') return item.status === 'completed';
    if (viewMode === 'forecast') return item.status === 'confirmed' || item.status === 'pending';
    return true; 
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients (name),
          services (name, price),
          professionals (name)
        `)
        .eq('user_id', user?.id)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      const formattedData = appointments.map((app: any) => ({
        id: app.id,
        appointment_date: app.appointment_date,
        appointment_time: app.appointment_time,
        status: app.status,
        client_name: app.clients?.name || 'Cliente deletado',
        service_name: app.services?.name || 'Serviço deletado',
        professional_name: app.professionals?.name || 'Sem Profissional',
        price: app.services?.price || 0,
      }));

      setData(formattedData);
    } catch (error: any) {
      toast.error(t('auth.error_generic'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const setFilterDate = (type: 'today' | 'week' | 'month') => {
    const today = new Date();
    if (type === 'today') {
      const day = format(today, 'yyyy-MM-dd');
      setStartDate(day);
      setEndDate(day);
    } else if (type === 'week') {
      setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'));
    } else if (type === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    }
  };

  const handleExportCSV = () => {
    const headers = [t('dashboard.financial.col_date'), 'Hora', t('dashboard.financial.col_client'), t('dashboard.financial.col_service'), 'Profissional', t('dashboard.financial.col_value'), 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [ 
        format(parseISO(item.appointment_date), 'dd/MM/yyyy'),
        item.appointment_time.slice(0, 5),
        `"${item.client_name}"`, 
        `"${item.service_name}"`,
        `"${item.professional_name}"`,
        item.price.toFixed(2),
        item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${startDate}_${endDate}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: i18n.language === 'en' ? 'USD' : 'BRL' }).format(value);
  }

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:bg-white">
      
      <div className="print:hidden space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-display font-bold">{t('dashboard.financial.title')}</h2>
            <p className="text-muted-foreground">{t('dashboard.financial.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <Card className="p-4 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full grid grid-cols-3 gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFilterDate('today')} className="border">{t('dashboard.filters.today')}</Button>
              <Button variant="ghost" size="sm" onClick={() => setFilterDate('week')} className="border">{t('dashboard.filters.week')}</Button>
              <Button variant="ghost" size="sm" onClick={() => setFilterDate('month')} className="border">{t('dashboard.filters.month')}</Button>
            </div>
            
            <div className="flex gap-2 items-center w-full md:w-auto">
              <div className="grid gap-1.5 flex-1">
                <span className="text-xs font-medium">{t('dashboard.calendar.from')}</span>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-1.5 flex-1">
                <span className="text-xs font-medium">{t('dashboard.calendar.to')}</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-green-500 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('dashboard.financial.card_realized')}</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">{formatMoney(realizedRevenue)}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-blue-500 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('dashboard.financial.card_forecast')}</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{formatMoney(forecastRevenue)}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-gray-500 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('dashboard.financial.card_volume')}</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-700">{completedCount}</h3>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden print:shadow-none print:border-none">
        
        <div className="p-4 border-b bg-muted/30 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Extrato
          </h3>
          
          <div className="flex p-1 bg-white border rounded-lg">
            <button onClick={() => setViewMode('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'all' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}>{t('dashboard.financial.filter_all')}</button>
            <button onClick={() => setViewMode('realized')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'realized' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-green-600'}`}>{t('dashboard.financial.filter_realized')}</button>
            <button onClick={() => setViewMode('forecast')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'forecast' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-blue-600'}`}>{t('dashboard.financial.filter_forecast')}</button>
          </div>
        </div>
        
        <div className="hidden print:block mb-6 text-center pt-4">
          <h1 className="text-xl font-bold">{t('dashboard.financial.title')}</h1>
          <p className="text-sm text-gray-500">Período: {format(parseISO(startDate), 'dd/MM/yyyy')} - {format(parseISO(endDate), 'dd/MM/yyyy')}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3">{t('dashboard.financial.col_date')}</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">{t('dashboard.financial.col_client')}</th>
                <th className="px-4 py-3">{t('dashboard.financial.col_service')}</th>
                <th className="px-4 py-3 text-primary">Profissional</th>
                <th className="px-4 py-3">{t('dashboard.financial.col_value')}</th>
                <th className="px-4 py-3">{t('dashboard.financial.col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum registro.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      {format(parseISO(item.appointment_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.appointment_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">{item.client_name}</td>
                    <td className="px-4 py-3">{item.service_name}</td>
                    <td className="px-4 py-3 font-medium text-primary">
                        {item.professional_name}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">
                      {formatMoney(item.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                        ${item.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${item.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                        ${item.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${item.status === 'no_show' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${item.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      `}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}