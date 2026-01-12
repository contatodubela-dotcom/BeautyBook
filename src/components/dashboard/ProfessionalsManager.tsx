import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next'; // <---

interface Professional {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

export default function ProfessionalsManager() {
  const { user } = useAuth();
  const { t } = useTranslation(); // <---
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    capacity: '1',
  });

  // 1. Busca Profissionais
  const { data: professionals } = useQuery({
    queryKey: ['professionals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
      if (error) throw error;
      return data as Professional[];
    },
  });

  // 2. Mutações
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('professionals').insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success(t('common.save') + '!');
      handleClose();
    },
    onError: () => toast.error(t('auth.error_generic')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('professionals').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success(t('common.save') + '!');
      handleClose();
    },
    onError: () => toast.error(t('auth.error_generic')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success(t('common.delete') + '!');
    },
    onError: (error: any) => {
        if (error.code === '23503') {
            toast.error('Não é possível excluir: Agendamentos vinculados.');
        } else {
            toast.error(t('auth.error_generic'));
        }
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      const { error } = await supabase.from('professionals').update({ is_active: !currentState }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      capacity: parseInt(formData.capacity) || 1,
    };

    if (editingProf) {
      updateMutation.mutate({ id: editingProf.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (prof: Professional) => {
    setEditingProf(prof);
    setFormData({
      name: prof.name,
      capacity: prof.capacity.toString(),
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProf(null);
    setFormData({ name: '', capacity: '1' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.team.title')}</h2>
          <p className="text-gray-400">{t('dashboard.team.subtitle')}</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-gray-900 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.team.btn_new')}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-[#1e293b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProf ? t('common.edit') : t('dashboard.team.btn_new')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase">{t('dashboard.team.label_name')}</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dra. Ana"
                  required
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase">{t('dashboard.team.label_capacity')}</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  className="bg-black/20 border-white/10 text-white"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                    {t('dashboard.team.hint_capacity')}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 text-gray-400">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1 bg-primary text-gray-900 font-bold">{t('common.save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals?.map((prof) => (
          <Card key={prof.id} className="p-5 bg-[#1e293b] border-white/10 shadow-lg group">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prof.is_active ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-500'}`}>
                        <UserCheck className="w-5 h-5" />
                   </div>
                   <div>
                       <h3 className={`font-bold text-lg ${!prof.is_active && 'text-gray-500 line-through'}`}>{prof.name}</h3>
                       <span className="text-xs text-gray-400 block">
                           <strong className="text-white">{prof.capacity}</strong> vagas
                       </span>
                   </div>
               </div>
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-white/5 pt-4">
                 <Button 
                    size="sm" 
                    variant="outline" 
                    className={`flex-1 border-white/10 ${prof.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-500'}`}
                    onClick={() => toggleActiveMutation.mutate({ id: prof.id, currentState: prof.is_active })}
                 >
                    {prof.is_active ? t('dashboard.team.active') : t('dashboard.team.inactive')}
                 </Button>
                 
                 <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => handleEdit(prof)}>
                    <Edit className="w-4 h-4" />
                 </Button>
                 
                 <Button size="icon" variant="ghost" className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10" onClick={() => {
                     if(window.confirm(t('common.confirm_delete'))) deleteMutation.mutate(prof.id)
                 }}>
                    <Trash2 className="w-4 h-4" />
                 </Button>
            </div>
          </Card>
        ))}

        {(!professionals || professionals.length === 0) && (
            <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-xl">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t('dashboard.team.empty')}</p>
            </div>
        )}
      </div>
    </div>
  );
}