import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, User, Plus, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ProfessionalsManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // checkLimit foi removido daqui pois faremos a checagem manual
  const { plan, loading: loadingPlan } = usePlan();
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
        .eq('is_active', true)
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

      // CORREÇÃO: Verificação manual do limite (Free = 1, Pro/Business = Ilimitado)
      const currentCount = professionals?.length || 0;
      if (plan === 'free' && currentCount >= 1) {
         throw new Error("Limite do plano atingido");
      }

      const { error } = await supabase.from('professionals').insert({
        name,
        business_id: member.business_id,
        is_active: true
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals-list'] });
      setNewProName('');
      setIsCreating(false);
      toast.success(t('toasts.pro_created', {defaultValue: 'Profissional adicionado!'}));
    },
    onError: (err) => {
      toast.error(err.message === "Limite do plano atingido" ? t('toasts.plan_limit', {defaultValue: 'Limite do plano atingido'}) : t('toasts.error_generic', {defaultValue: 'Erro ao processar'}));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('professionals').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals-list'] });
      toast.success(t('toasts.pro_deleted', {defaultValue: 'Profissional removido.'}));
    },
    onError: () => toast.error(t('toasts.error_generic', {defaultValue: 'Erro ao processar'}))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProName.trim()) return;
    createMutation.mutate(newProName);
  };

  // CORREÇÃO: Lógica manual para habilitar/desabilitar o botão
  // Se NÃO for free, ou se tiver menos de 1 profissional, pode adicionar.
  const canAdd = plan !== 'free' || (professionals?.length || 0) < 1;

  if (isLoading || loadingPlan) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.team.title', { defaultValue: 'Equipe' })}</h2>
          <p className="text-slate-400">{t('dashboard.team.subtitle', { defaultValue: 'Gerencie quem atende em seu negócio.' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card de Adicionar (ou Bloqueio) */}
        {canAdd ? (
           isCreating ? (
             <Card className="p-4 border-primary/50 bg-slate-800/50 flex flex-col justify-center animate-in fade-in zoom-in-95">
               <form onSubmit={handleSubmit} className="space-y-3">
                 <Input 
                   placeholder={t('dashboard.team.name_placeholder', {defaultValue: 'Nome do Profissional'})}
                   value={newProName}
                   onChange={e => setNewProName(e.target.value)}
                   autoFocus
                   className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                 />
                 <div className="flex gap-2 justify-end">
                   <Button type="button" size="sm" variant="ghost" onClick={() => setIsCreating(false)}>{t('common.cancel', {defaultValue: 'Cancelar'})}</Button>
                   <Button type="submit" size="sm" disabled={createMutation.isPending} className="bg-primary text-slate-900 font-bold">
                     {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save', {defaultValue: 'Salvar'})}
                   </Button>
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
              onClick={() => window.location.hash = '#pricing'}
            >
              {t('dashboard.banner.cta', {defaultValue: 'Ver Planos'})}
            </Button>
          </div>
        )}

        {/* Lista de Profissionais */}
        {professionals?.map((pro) => (
          <Card key={pro.id} className="p-4 bg-slate-800 border-slate-700 flex items-center justify-between group hover:border-slate-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{pro.name}</h3>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> {t('common.active', {defaultValue: 'Ativo'})}
                </span>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                if(confirm(t('toasts.confirm_delete_pro', {defaultValue: 'Remover este profissional?'}))) deleteMutation.mutate(pro.id)
              }}
              className="text-slate-600 hover:text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}