import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Ban, Search, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next'; // <---

export default function ClientsManager() {
  const { user } = useAuth();
  const { t } = useTranslation(); // <---
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients } = useQuery({
    queryKey: ['clients-with-appointments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          client_id,
          clients (id, name, phone),
          status
        `)
        .eq('user_id', user?.id);

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
  });

  const { data: blockedClients } = useQuery({
    queryKey: ['blocked-clients', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_clients')
        .select('*, clients(*)')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ client_id, no_show_count }: { client_id: string; no_show_count: number }) => {
      const { error } = await supabase
        .from('blocked_clients')
        .upsert({
          user_id: user?.id,
          client_id,
          no_show_count,
          reason: 'Múltiplos no-shows',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-clients'] });
      toast.success('Cliente bloqueado!');
    },
    onError: () => {
      toast.error('Erro ao bloquear cliente');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (client_id: string) => {
      const { error } = await supabase
        .from('blocked_clients')
        .delete()
        .eq('user_id', user?.id)
        .eq('client_id', client_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-clients'] });
      toast.success('Cliente desbloqueado!');
    },
    onError: () => {
      toast.error('Erro ao desbloquear cliente');
    },
  });

  const filteredClients = clients?.filter(
    (client: any) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const isBlocked = (clientId: string) => {
    return blockedClients?.some((bc: any) => bc.client_id === clientId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">{t('dashboard.clients.title')}</h2>
        <p className="text-muted-foreground">{t('dashboard.clients.subtitle')}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Blocked Clients Section */}
      {blockedClients && blockedClients.length > 0 && (
        <Card className="p-6 bg-destructive/5 border-destructive/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
            <UserX className="w-5 h-5" />
            {t('dashboard.clients.blocked_title')} ({blockedClients.length})
          </h3>
          <div className="space-y-3">
            {blockedClients.map((bc: any) => (
              <div
                key={bc.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg"
              >
                <div>
                  <p className="font-medium">{bc.clients.name}</p>
                  <p className="text-sm text-muted-foreground">{bc.clients.phone}</p>
                  <p className="text-xs text-destructive mt-1">
                    {bc.no_show_count} falta(s) • Bloqueado em{' '}
                    {new Date(bc.blocked_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unblockMutation.mutate(bc.client_id)}
                >
                  {t('dashboard.clients.btn_unblock')}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients?.map((client: any) => {
          const blocked = isBlocked(client.id);
          return (
            <Card
              key={client.id}
              className={`p-4 ${blocked ? 'opacity-50 border-destructive/20' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                </div>
                {blocked && <Ban className="w-5 h-5 text-destructive" />}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                <div>
                  <p className="text-muted-foreground text-xs">{t('dashboard.clients.stats_total')}</p>
                  <p className="font-semibold">{client.total_appointments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('dashboard.clients.stats_confirmed')}</p>
                  <p className="font-semibold text-success">{client.confirmed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('dashboard.clients.stats_noshow')}</p>
                  <p className="font-semibold text-destructive">{client.no_shows}</p>
                </div>
              </div>

              {!blocked && client.no_shows >= 2 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => blockMutation.mutate({ 
                    client_id: client.id, 
                    no_show_count: client.no_shows 
                  })}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {t('dashboard.clients.btn_block')}
                </Button>
              )}
            </Card>
          );
        })}

        {(!filteredClients || filteredClients.length === 0) && (
          <Card className="p-8 col-span-full">
            <p className="text-center text-muted-foreground">
              {t('dashboard.clients.empty')}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}