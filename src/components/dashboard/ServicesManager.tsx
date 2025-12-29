import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Clock, DollarSign, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '../../types';

export default function ServicesManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    category: '', 
    description: '',
    duration_minutes: '',
    price: '',
  });

  // Busca os serviços
  const { data: services } = useQuery({
    queryKey: ['services', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user?.id)
        .order('category', { ascending: true }) 
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  // Lógica de Agrupamento
  const groupedServices = useMemo(() => {
    if (!services) return {};
    return services.reduce((acc, service) => {
      const cat = service.category || 'Geral / Outros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  // --- MUTAÇÕES ---
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('services').insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Procedimento criado!');
      handleClose();
    },
    onError: () => toast.error('Erro ao criar procedimento'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Procedimento atualizado!');
      handleClose();
    },
    onError: () => toast.error('Erro ao atualizar procedimento'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Procedimento excluído!');
    },
    onError: () => toast.error('Erro ao excluir procedimento'),
  });

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      category: formData.category || 'Geral',
      description: formData.description,
      duration_minutes: parseInt(formData.duration_minutes),
      price: formData.price ? parseFloat(formData.price) : null,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category || '',
      description: service.description || '',
      duration_minutes: service.duration_minutes.toString(),
      price: service.price?.toString() || '',
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingService(null);
    setFormData({ name: '', category: '', description: '', duration_minutes: '', price: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Menu de Serviços</h2>
          <p className="text-gray-400">Organize o que seu estabelecimento oferece.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-gray-900 font-bold shadow-[0_0_20px_rgba(246,173,85,0.3)] border-none">
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          
          {/* MODAL DE CADASTRO (Fundo Escuro) */}
          <DialogContent className="max-w-md bg-[#1e293b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase tracking-wider">Nome do Serviço *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Sessão Turbo"
                  required
                  className="bg-black/20 border-white/10 text-white placeholder-gray-600 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase tracking-wider">Categoria</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: 1. Bronze..."
                      list="categories-list"
                      className="bg-black/20 border-white/10 text-white placeholder-gray-600 focus:border-primary"
                    />
                    <datalist id="categories-list">
                      <option value="1. Bronzeamento em Máquina" />
                      <option value="2. Bronzeamento a Jato" />
                      <option value="3. Bronzeamento natural" />
                      <option value="4. Spa e Cuidados" />
                    </datalist>
                 </div>
                 <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase tracking-wider">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0,00"
                      className="bg-black/20 border-white/10 text-white placeholder-gray-600 focus:border-primary"
                    />
                 </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase tracking-wider">Duração (min) *</label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="Ex: 30"
                  required
                  min="5"
                  className="bg-black/20 border-white/10 text-white placeholder-gray-600 focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-400 uppercase tracking-wider">Descrição</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus-visible:outline-none focus-visible:border-primary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Acelerador incluso. Resultado imediato."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 text-gray-400 hover:text-white hover:bg-white/5">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-gray-900 font-bold">
                  {editingService ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- LISTAGEM (Agora com Cartões Escuros) --- */}
      <div className="space-y-10">
        {Object.entries(groupedServices).map(([category, items]) => (
          <div key={category} className="animate-fade-in">
            
            {/* Título da Seção (BRANCO E VISÍVEL) */}
            <div className="flex items-center gap-3 mb-5 border-l-4 border-primary pl-4">
               <h3 className="text-xl font-bold text-white tracking-wide">{category}</h3>
               <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/5">
                 {items.length} opções
               </span>
            </div>

            {/* Grid de Serviços */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((service) => (
                <Card key={service.id} className="group relative p-5 hover:border-primary/50 transition-all border-white/10 bg-[#1e293b] shadow-lg">
                  
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-white text-lg leading-tight pr-2">{service.name}</h4>
                    {service.price && (
                        <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded text-sm border border-primary/20 whitespace-nowrap">
                            R$ {service.price.toFixed(2)}
                        </span>
                    )}
                  </div>
                  
                  {/* Descrição */}
                  {service.description ? (
                      <p className="text-sm text-gray-400 mb-5 min-h-[2.5rem] line-clamp-2 leading-relaxed">
                          {service.description}
                      </p>
                  ) : (
                      <div className="mb-5 min-h-[2.5rem]"></div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{service.duration_minutes} minutos</span>
                      </div>
                      
                      {/* Botões de Ação */}
                      <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                                if(window.confirm('Excluir este serviço?')) {
                                    deleteMutation.mutate(service.id)
                                }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                      </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {(!services || services.length === 0) && (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
               <Layers className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white">Seu menu está vazio</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Cadastre seus serviços e categorias para começar a receber agendamentos.
            </p>
            <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-gray-900 font-bold">
              Criar Primeiro Serviço
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}