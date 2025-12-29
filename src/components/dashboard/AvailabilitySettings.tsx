import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Clock, Copy, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
];

export default function AvailabilitySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingDay, setEditingDay] = useState<any>(null);
  
  // Estado temporário para edição
  const [times, setTimes] = useState({ start: '', end: '' });

  // 1. BUSCA O PERFIL (PARA O LINK PERSONALIZADO)
  const { data: profile } = useQuery({
    queryKey: ['my-profile-slug', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('user_id', user?.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // 2. BUSCA DISPONIBILIDADE
  const { data: availability } = useQuery({
    queryKey: ['availability', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
  });

  // CONSTRÓI O LINK (Lógica nova)
  const baseUrl = window.location.origin;
  const publicUrl = profile?.slug 
    ? `${baseUrl}/${profile.slug}` 
    : `${baseUrl}/book/${user?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  // --- MUTAÇÕES DE DISPONIBILIDADE ---
  const toggleDayMutation = useMutation({
    mutationFn: async ({ dayId, currentStatus }: { dayId: number, currentStatus: boolean }) => {
      const setting = availability?.find(a => a.day_of_week === dayId);
      
      if (setting) {
        await supabase
          .from('availability_settings')
          .update({ is_active: !currentStatus })
          .eq('id', setting.id);
      } else {
        await supabase.from('availability_settings').insert({
          user_id: user?.id,
          day_of_week: dayId,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability'] }),
  });

  const updateTimeMutation = useMutation({
    mutationFn: async () => {
      if (!editingDay) return;
      
      // Verifica se já existe registro
      const setting = availability?.find(a => a.day_of_week === editingDay.id);

      if (setting) {
        await supabase
          .from('availability_settings')
          .update({ 
            start_time: times.start,
            end_time: times.end,
            is_active: true 
          })
          .eq('id', setting.id);
      } else {
        await supabase.from('availability_settings').insert({
          user_id: user?.id,
          day_of_week: editingDay.id,
          start_time: times.start,
          end_time: times.end,
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setEditingDay(null);
      toast.success('Horário atualizado!');
    },
  });

  const openEditModal = (day: any) => {
    const setting = availability?.find(a => a.day_of_week === day.id);
    setEditingDay(day);
    setTimes({
      start: setting?.start_time || '09:00',
      end: setting?.end_time || '18:00'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold text-white">Horários de Atendimento</h2>
        <p className="text-gray-400">Configure sua disponibilidade semanal e link de agendamento.</p>
      </div>

      {/* CARTÃO DO LINK PÚBLICO (ATUALIZADO) */}
      <Card className="p-6 bg-[#1e293b] border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-primary font-medium mb-1">
            <LinkIcon className="w-4 h-4" />
            <h3>Link Público de Agendamento</h3>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                readOnly
                value={publicUrl}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
            <Button onClick={handleCopyLink} variant="outline" className="border-white/10 hover:bg-white/5 text-white">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Compartilhe este link com seus clientes para que possam agendar online.
          </p>
        </div>
      </Card>

      {/* LISTA DE DIAS DA SEMANA */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const setting = availability?.find(a => a.day_of_week === day.id);
          const isActive = setting?.is_active ?? false;
          const startTime = setting?.start_time?.slice(0, 5) || '09:00';
          const endTime = setting?.end_time?.slice(0, 5) || '18:00';

          return (
            <Card key={day.id} className={`p-4 transition-all border-white/10 bg-[#1e293b] ${isActive ? 'border-l-4 border-l-primary' : 'opacity-70'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={isActive}
                    onCheckedChange={() => toggleDayMutation.mutate({ dayId: day.id, currentStatus: isActive })}
                  />
                  <div>
                    <span className="font-bold text-white block">{day.label}</span>
                    {isActive ? (
                       <span className="text-sm text-gray-400 flex items-center gap-1">
                         <Clock className="w-3 h-3" /> {startTime} - {endTime}
                       </span>
                    ) : (
                       <span className="text-sm text-gray-500">Fechado</span>
                    )}
                  </div>
                </div>

                <Dialog open={editingDay?.id === day.id} onOpenChange={(open) => !open && setEditingDay(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditModal(day)}
                      className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1e293b] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Horário para {day.label}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">Abertura</label>
                        <Input 
                          type="time" 
                          value={times.start} 
                          onChange={(e) => setTimes({...times, start: e.target.value})}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">Fechamento</label>
                        <Input 
                          type="time" 
                          value={times.end} 
                          onChange={(e) => setTimes({...times, end: e.target.value})}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <Button onClick={() => updateTimeMutation.mutate()} className="w-full bg-primary text-gray-900 font-bold hover:bg-primary/90">
                      Salvar Horário
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}