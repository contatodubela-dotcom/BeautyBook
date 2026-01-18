import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, User, Plus, Crown, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ProfessionalsManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { checkLimit, plan, loading: loadingPlan } = usePlan();
  const queryClient = useQueryClient();
  const [newProName, setNewProName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals-list', user?.id],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      const businessId = member?.business_id;
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      if (!member?.business_id) throw new Error("Empresa não encontrada");

      const { error } = await supabase.from('professionals').insert({
        name,
        business_id: member.business_id, 
        capacity: 1,
        is_active: true
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals-list'] });
      queryClient.invalidateQueries({ queryKey: ['usage-metrics'] });
      setNewProName('');
      setIsCreating(false);
      toast.success(t('toasts.pro_added'));
    },
    onError: () => toast.error(t('toasts.pro_add_error'))
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals-list'] });
      toast.success(t('toasts.pro_deleted'));
    },
    onError: () => toast.error(t('toasts.pro_delete_error'))
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProName.trim()) return;
    createMutation.mutate(newProName);
  };

  const canAdd = checkLimit('professionals');

  if (isLoading || loadingPlan) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.team.title', { defaultValue: 'Equipe' })}</h2>
          <p className="text-slate-400">{t('dashboard.team.subtitle', { defaultValue: 'Gerencie quem atende em sua empresa.' })}</p>
        </div>
        
        <div className="text-sm bg-slate-800 px-3 py-1 rounded-full border border-white/10 text-slate-300 font-medium">
          {professionals?.length || 0} / {plan === 'business' ? '∞' : (plan === 'pro' ? '3' : '1')} {t('dashboard.team.active_count', { defaultValue: 'Ativos' })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals?.map((pro) => (
          <Card key={pro.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-all bg-[#1e293b] border-white/10 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">{pro.name}</p>
                <p className="text-xs text-slate-400">{t('dashboard.team.active', { defaultValue: 'Ativo' })}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-500 hover:text-red-400 hover:bg-red-900/20"
              onClick={() => {
                if (confirm(t('common.confirm_delete', {defaultValue: 'Tem certeza?'}))) deleteMutation.mutate(pro.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}

        {canAdd ? (
           isCreating ? (
             <Card className="p-4 border-dashed border-2 border-primary/20 bg-slate-800/50 flex flex-col justify-center gap-2">
               <form onSubmit={handleAdd}>
                 <Input 
                   autoFocus
                   placeholder={t('dashboard.team.label_name', {defaultValue: 'Nome do profissional'})}
                   value={newProName}
                   onChange={e => setNewProName(e.target.value)}
                   className="bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                 />
                 <div className="flex gap-2 mt-2 justify-end">
                   <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">{t('common.cancel', {defaultValue: 'Cancelar'})}</Button>
                   <Button type="submit" size="sm" disabled={createMutation.isPending} className="bg-primary text-slate-900 font-bold">{t('common.save', {defaultValue: 'Salvar'})}</Button>
                 </div>
               </form>
             </Card>
           ) : (
             <button 
                onClick={() => setIsCreating(true)}
                className="group h-full min-h-[80px] rounded-xl border-2 border-dashed border-slate-700 hover:border-primary hover:bg-slate-800 flex items-center justify-center gap-2 transition-all p-4"
             >
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-primary flex items-center justify-center transition-colors">
                   <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                </div>
                <span className="text-sm font-medium text-slate-500 group-hover:text-primary">{t('dashboard.team.btn_new', {defaultValue: 'Adicionar Profissional'})}</span>
             </button>
           )
        ) : (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 flex flex-col items-center justify-center text-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <p className="text-sm font-bold text-amber-500">{t('dashboard.team.limit_free', {defaultValue: 'Limite do plano atingido'})}</p>
            <Button 
              size="sm" 
              className="bg-amber-600 hover:bg-amber-700 text-white w-full border-none"
              onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('dashboard.banner.cta', {defaultValue: 'Ver Planos'})}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}