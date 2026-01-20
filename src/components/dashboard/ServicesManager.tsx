import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Scissors, Plus, Clock, DollarSign, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ServiceForm {
  name: string;
  duration: string;
  price: string;
  category: string;
  description: string; // Novo campo
}

export default function ServicesManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const [form, setForm] = useState<ServiceForm>({
    name: '',
    duration: '30',
    price: '',
    category: 'Geral',
    description: '' // Inicializa vazio
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services-list', user?.id],
    queryFn: async () => {
      const { data: member } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user?.id)
        .single();

      const businessId = member?.business_id;
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newService: ServiceForm) => {
      const { data: member } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user?.id)
        .single();
        
      if (!member?.business_id) throw new Error("Empresa não encontrada");

      const priceValue = newService.price ? parseFloat(newService.price.replace(',', '.')) : 0;
      const durationValue = parseInt(newService.duration) || 30;

      const { error } = await supabase.from('services').insert({
        name: newService.name,
        duration_minutes: durationValue,
        price: priceValue,
        category: newService.category,
        description: newService.description, // Salva a descrição no banco
        business_id: member.business_id,
        is_active: true
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-list'] });
      setForm({ name: '', duration: '30', price: '', category: 'Geral', description: '' });
      setIsCreating(false);
      toast.success(t('toasts.service_created'));
    },
    onError: (error: any) => {
      toast.error(t('toasts.service_error'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false }) 
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-list'] });
      toast.success(t('toasts.service_deleted', { defaultValue: 'Serviço arquivado.' }));
    },
    onError: () => toast.error(t('toasts.service_delete_error'))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMutation.mutate(form);
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.services.title', { defaultValue: 'Serviços' })}</h2>
          <p className="text-slate-400">{t('dashboard.services.subtitle', { defaultValue: 'Configure o que você oferece aos clientes.' })}</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2 bg-primary text-slate-900 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> {t('dashboard.services.btn_new')}
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 border border-white/10 bg-slate-800 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 items-end">
            
            {/* Linha 1: Nome e Categoria */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_name')}</label>
              <Input 
                placeholder="Ex: Corte de Cabelo" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                autoFocus
                required
                className="bg-white text-slate-900" 
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_category')}</label>
              <Input 
                placeholder="Ex: Cabelo" 
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="bg-white text-slate-900"
              />
            </div>

            {/* Linha 2: Preço e Duração */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_price')}</label>
              <div className="relative">
                 <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                 <Input 
                   placeholder="0,00" 
                   value={form.price}
                   onChange={e => setForm({...form, price: e.target.value})}
                   className="pl-8 bg-white text-slate-900"
                 />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_duration')}</label>
              <div className="relative">
                 <Clock className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                 <Input 
                   type="number"
                   placeholder="30" 
                   value={form.duration}
                   onChange={e => setForm({...form, duration: e.target.value})}
                   className="pl-8 bg-white text-slate-900"
                 />
              </div>
            </div>

            {/* Linha 3: Descrição (Ocupa tudo) */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_desc', {defaultValue: 'Descrição'})}</label>
              <div className="relative">
                 <FileText className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                 <Input 
                   placeholder={t('dashboard.services.desc_placeholder', {defaultValue: 'Ex: Inclui lavagem e finalização.'})}
                   value={form.description}
                   onChange={e => setForm({...form, description: e.target.value})}
                   className="pl-8 bg-white text-slate-900"
                 />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="text-slate-300 hover:text-white">{t('common.cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-slate-900 font-bold">{t('common.save')}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3">
        {services?.length === 0 && !isCreating && (
          <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
             <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
             <p>{t('dashboard.services.empty_desc')}</p>
          </div>
        )}

        {services?.map((service) => (
          <Card key={service.id} className="p-4 flex items-center justify-between hover:border-primary/30 transition-all group border-white/10 bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                {service.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white">{service.name}</h3>
                {/* Exibe a descrição se existir */}
                {service.description && (
                   <p className="text-xs text-slate-500 mt-0.5 max-w-md truncate">{service.description}</p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration_minutes} min</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="flex items-center gap-1 font-medium text-primary">
                     {new Intl.NumberFormat(t('common.price_locale', {defaultValue: 'pt-BR'}), { style: 'currency', currency: t('common.currency', {defaultValue: 'BRL'}) }).format(service.price || 0)}
                  </span>
                  <span className="bg-slate-700 px-2 py-0.5 rounded-full uppercase text-[10px] tracking-wide text-slate-300">{service.category || 'Geral'}</span>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
              onClick={() => {
                 if (confirm(t('toasts.confirm_delete_service', {defaultValue: 'Arquivar este serviço?'}))) deleteMutation.mutate(service.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}