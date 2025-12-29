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

interface Professional {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

export default function ProfessionalsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    capacity: '1', // Padrão é 1 (Exclusivo)
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

  // 2. Mutações (Criar, Editar, Excluir)
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('professionals').insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional adicionado!');
      handleClose();
    },
    onError: () => toast.error('Erro ao adicionar.'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('professionals').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional atualizado!');
      handleClose();
    },
    onError: () => toast.error('Erro ao atualizar.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        // Primeiro verificamos se tem agendamentos futuros para evitar erro de chave estrangeira
        // Para simplificar, tentamos deletar. Se o banco reclamar, avisamos.
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional removido!');
    },
    onError: (error: any) => {
        // Erro comum: violação de foreign key (tem agendamentos vinculados)
        if (error.code === '23503') {
            toast.error('Não é possível excluir: Este profissional possui agendamentos vinculados. Tente desativá-lo.');
        } else {
            toast.error('Erro ao excluir profissional.');
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
          <h2 className="text-2xl font-bold text-white">Equipe & Capacidade</h2>
          <p className="text-gray-400">Gerencie quem trabalha e quantos clientes cada um atende simultaneamente.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-gray-900 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Profissional
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-[#1e293b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProf ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dra. Ana"
                  required
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase">Capacidade de Atendimento (Vagas)</label>
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
                    * Coloque <b>1</b> para atendimento exclusivo.<br/>
                    * Coloque <b>4</b> para atender até 4 pessoas no mesmo horário.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 text-gray-400">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-primary text-gray-900 font-bold">Salvar</Button>
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
                           Capacidade: <strong className="text-white">{prof.capacity}</strong> cliente(s)
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
                    {prof.is_active ? 'Ativo' : 'Inativo'}
                 </Button>
                 
                 <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => handleEdit(prof)}>
                    <Edit className="w-4 h-4" />
                 </Button>
                 
                 <Button size="icon" variant="ghost" className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10" onClick={() => {
                     if(window.confirm('Tem certeza? Isso pode falhar se houver agendamentos.')) deleteMutation.mutate(prof.id)
                 }}>
                    <Trash2 className="w-4 h-4" />
                 </Button>
            </div>
          </Card>
        ))}

        {(!professionals || professionals.length === 0) && (
            <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-xl">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum profissional cadastrado.</p>
            </div>
        )}
      </div>
    </div>
  );
}