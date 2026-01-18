import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Ban, Search, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ClientsManager() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Busca Business ID
  const getBusinessId = async () => {
    const { data } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
    return data?.business_id;
  }

  // 2. Busca Clientes e Estatísticas
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients-business', user?.id],
    queryFn: async () => {
      const businessId = await getBusinessId();
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          client_id,
          clients (id, name, phone),
          status
        `)
        .eq('business_id', businessId);

      if (error) throw error;

      const clientMap = new Map();
      data.forEach((apt: any) => {
        if (!apt.clients) return;
        const clientId = apt.clients.id;
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            ...apt.clients,
            total_appointments: 0,
            no_shows: 0,
            confirmed: 0,
          });
        }
        const client = clientMap.get(clientId);
        client.total_appointments++;
        if (apt.status === 'no_show') client.no_shows++;
        if (apt.status === 'confirmed') client.confirmed++;
      });

      return Array.from(clientMap.values());
    },
    enabled: !!user?.id,
  });

  // 3. Busca Bloqueios
  const { data: blockedClients } = useQuery({
    queryKey: ['blocked-clients', user?.id],
    queryFn: async () => {
      const businessId = await getBusinessId();
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('blocked_clients')
        .select('*, clients(*)')
        .eq('business_id', businessId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // 4. Bloquear Cliente
  const blockMutation = useMutation({
    mutationFn: async ({ client_id, no_show_count }: { client_id: string; no_show_count: number }) => {
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Empresa não encontrada");

      const { error } = await supabase.from('blocked_clients').upsert({
          business_id: businessId,
          client_id,
          no_show_count,
          reason: 'Múltiplos no-shows',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-clients'] });
      toast.success(t('toasts.client_blocked'));
    },
    onError: () => toast.error(t('toasts.error_block')),
  });

  // 5. Desbloquear Cliente
  const unblockMutation = useMutation({
    mutationFn: async (client_id: string) => {
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Empresa não encontrada");

      const { error } = await supabase
        .from('blocked_clients')
        .delete()
        .eq('business_id', businessId)
        .eq('client_id', client_id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-clients'] });
      toast.success(t('toasts.client_unblocked'));
    },
    onError: () => toast.error(t('toasts.error_unblock')),
  });

  const filteredClients = clients?.filter(
    (client: any) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const isBlocked = (clientId: string) => blockedClients?.some((bc: any) => bc.client_id === clientId);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1 text-white">{t('dashboard.clients.title', {defaultValue: 'Clientes'})}</h2>
        <p className="text-slate-400">{t('dashboard.clients.subtitle', {defaultValue: 'Histórico de quem já agendou.'})}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder={t('common.search_placeholder', {defaultValue: 'Buscar nome ou telefone...'})} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10 bg-white text-slate-900 border-slate-200 focus:border-primary" 
        />
      </div>

      {/* Lista de Bloqueados */}
      {blockedClients && blockedClients.length > 0 && (
        <Card className="p-6 bg-red-950/20 border-red-500/20 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
            <UserX className="w-5 h-5" />
            {t('dashboard.clients.blocked_title', {defaultValue: 'Bloqueados'})} ({blockedClients.length})
          </h3>
          <div className="space-y-3">
            {blockedClients.map((bc: any) => (
              <div key={bc.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-red-500/10">
                <div>
                  <p className="font-medium text-red-200">{bc.clients?.name}</p>
                  <p className="text-xs text-red-400/70">
                    {bc.no_show_count} faltas • Bloqueado em {new Date(bc.blocked_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => unblockMutation.mutate(bc.client_id)} className="border-red-500/30 text-red-400 hover:bg-red-950">
                  {t('dashboard.clients.btn_unblock', {defaultValue: 'Desbloquear'})}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients?.map((client: any) => {
          const blocked = isBlocked(client.id);
          return (
            <Card key={client.id} className={`p-4 bg-[#1e293b] border-white/10 ${blocked ? 'opacity-50 border-red-500/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{client.name}</h3>
                  <p className="text-sm text-slate-400">{client.phone}</p>
                </div>
                {blocked && <Ban className="w-5 h-5 text-red-500" />}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                <div className="bg-slate-800 rounded p-1"><p className="text-slate-500 text-xs">{t('dashboard.clients.stats_total')}</p><p className="font-semibold text-white">{client.total_appointments}</p></div>
                <div className="bg-slate-800 rounded p-1"><p className="text-slate-500 text-xs">{t('dashboard.clients.stats_ok')}</p><p className="font-semibold text-green-400">{client.confirmed}</p></div>
                <div className="bg-slate-800 rounded p-1"><p className="text-slate-500 text-xs">{t('dashboard.clients.stats_faults')}</p><p className="font-semibold text-red-400">{client.no_shows}</p></div>
              </div>
              {!blocked && client.no_shows >= 2 && (
                <Button size="sm" variant="outline" className="w-full text-red-400 border-red-900/50 hover:bg-red-950/30" onClick={() => blockMutation.mutate({ client_id: client.id, no_show_count: client.no_shows })}>
                  <Ban className="w-4 h-4 mr-2" /> {t('dashboard.clients.btn_block', {defaultValue: 'Bloquear'})}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}