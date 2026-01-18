import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function usePlan() {
  const { user } = useAuth();

  // Busca os dados reais do banco usando a nova função RPC
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['usage-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_usage_metrics', { 
        target_user_id: user.id 
      });
      
      if (error) {
        console.error('Erro ao buscar métricas:', error);
        return null;
      }
      
      return data as { 
        appointments_used: number, 
        professionals_used: number,
        current_plan: string 
      };
    },
    enabled: !!user?.id,
    // Cache de 5 minutos para não martelar o banco, mas manter atualizado
    staleTime: 1000 * 60 * 5 
  });

  const plan = metrics?.current_plan || 'free';
  
  // DEFINIÇÃO DOS LIMITES (A Regra de Negócio Centralizada)
  const limits = {
    maxAppointments: plan === 'business' || plan === 'pro' ? 999999 : 50, // Free: 50/mês
    maxProfessionals: plan === 'business' ? 999999 : (plan === 'pro' ? 3 : 1), // Free: 1, Pro: 3
    hasReports: plan !== 'free',
    hasCustomLink: plan !== 'free',
  };

  const usage = {
    appointments: metrics?.appointments_used || 0,
    professionals: metrics?.professionals_used || 0,
  };

  // Função helper para verificar se pode executar ação
  const checkLimit = (feature: 'appointments' | 'professionals') => {
    if (feature === 'appointments') {
      return usage.appointments < limits.maxAppointments;
    }
    if (feature === 'professionals') {
      return usage.professionals < limits.maxProfessionals;
    }
    return true;
  };

  return {
    plan,
    usage,
    limits,
    checkLimit,
    loading: isLoading
  };
}