import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sparkles, Calendar, Clock, CheckCircle, ArrowLeft, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service, AvailabilitySetting } from '../types';

interface Professional {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

const generateGoogleCalendarUrl = (serviceName: string, date: string, time: string, duration: number) => {
  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + duration * 60000);
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceName)}&dates=${formatDate(start)}/${formatDate(end)}&details=Agendamento+confirmado+via+BeautyBook`;
};

// --- WRAPPER PARA RESOLVER O LINK ---
export default function BookingPage() {
  const { userId: paramId, slug: paramSlug } = useParams<{ userId: string; slug: string }>();

  const [resolvedUserId, setResolvedUserId] = useState<string | null>(paramId || null);
  const [loadingProfile, setLoadingProfile] = useState(!!paramSlug && !paramId);

  useEffect(() => {
    async function resolveSlug() {
      if (paramId) {
        setResolvedUserId(paramId);
        return;
      }

      if (paramSlug) {
        setLoadingProfile(true);
        const { data } = await supabase
          .from('business_profiles')
          .select('user_id')
          .eq('slug', paramSlug)
          .maybeSingle();

        if (data) {
          setResolvedUserId(data.user_id);
        } else {
          console.error("Salão não encontrado.");
        }
        setLoadingProfile(false);
      }
    }

    resolveSlug();
  }, [paramId, paramSlug]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!resolvedUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-slate-500">
        <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold">Página não encontrada</h2>
        <p>Verifique o endereço digitado.</p>
      </div>
    );
  }

  return <BookingContent userId={resolvedUserId} />;
}

// --- SEU CÓDIGO ORIGINAL (AGORA DENTRO DESTA FUNÇÃO) ---
function BookingContent({ userId }: { userId: string }) {
  const [step, setStep] = useState<'service' | 'datetime' | 'info' | 'success'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // 1. BUSCA SERVIÇOS
  const { data: services } = useQuery({
    queryKey: ['public-services', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('category', { ascending: true }) 
        .order('price', { ascending: true });   
      if (error) throw error;
      return data as Service[];
    },
  });

  const groupedServices = useMemo(() => {
    if (!services) return {};
    return services.reduce((acc, service) => {
      const cat = service.category || 'Geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  // 2. BUSCA PROFISSIONAIS
  const { data: professionals } = useQuery({
    queryKey: ['public-professionals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (error) return [];
      return data as Professional[];
    },
  });

  // 3. BUSCA DISPONIBILIDADE
  const { data: availability } = useQuery({
    queryKey: ['public-availability', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (error) throw error;
      return data as AvailabilitySetting[];
    },
  });

  // 4. BUSCA AGENDAMENTOS (Contagem de Vagas)
  const { data: appointmentCounts } = useQuery({
    queryKey: ['appointments-count', userId, selectedDate, selectedProfessional?.id],
    queryFn: async () => {
      if (!selectedDate || !selectedProfessional) return {};
      
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('user_id', userId)
        .eq('professional_id', selectedProfessional.id)
        .eq('appointment_date', selectedDate)
        .in('status', ['pending', 'confirmed']); 
        
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((app: any) => {
        const timeKey = app.appointment_time.slice(0, 5); 
        counts[timeKey] = (counts[timeKey] || 0) + 1;
      });
      return counts;
    },
    enabled: !!selectedDate && !!selectedProfessional,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      let clientId;
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientPhone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ name: clientName, phone: clientPhone })
          .select()
          .single();
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const { data: blocked } = await supabase
        .from('blocked_clients')
        .select('id')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (blocked) {
        throw new Error('Entre em contato com o estabelecimento.');
      }

      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        client_id: clientId,
        service_id: selectedService!.id,
        professional_id: selectedProfessional!.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar agendamento');
    },
  });

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      const dayOfWeek = date.getDay();
      const hasAvailability = availability?.some(a => a.day_of_week === dayOfWeek);
      if (hasAvailability) {
        dates.push(format(date, 'yyyy-MM-dd'));
      }
    }
    return dates;
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !availability || !selectedProfessional) return [];
    
    const dateObj = parseISO(selectedDate); 
    const dayOfWeek = dateObj.getDay(); 

    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    if (!dayAvailability) return [];

    const now = new Date();
    const isToday = isSameDay(dateObj, now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const slots = [];
    const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number);
    
    let loopHour = startHour;
    let loopMinute = startMinute;

    while (
      loopHour < endHour ||
      (loopHour === endHour && loopMinute < endMinute)
    ) {
      const timeString = `${String(loopHour).padStart(2, '0')}:${String(loopMinute).padStart(2, '0')}`;
      
      let isPast = false;
      if (isToday) {
        if (loopHour < currentHour || (loopHour === currentHour && loopMinute <= currentMinute)) {
          isPast = true;
        }
      }

      const currentCount = appointmentCounts?.[timeString] || 0;
      const capacity = selectedProfessional.capacity || 1;
      const isFull = currentCount >= capacity;

      if (!isPast && !isFull) {
        slots.push(timeString);
      }

      loopMinute += 30;
      if (loopMinute >= 60) {
        loopMinute = 0;
        loopHour++;
      }
    }
    return slots;
  };

  const handleDateTimeConfirm = () => {
    if (selectedDate && selectedTime && selectedProfessional) {
      setStep('info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointmentMutation.mutate();
  };

  return (
    <div className="min-h-screen !bg-[#f8fafc] flex flex-col items-center justify-start pt-8 pb-12 px-4 !text-slate-900" style={{ color: '#0f172a' }}>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2 relative">
          {step !== 'success' && step !== 'service' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep(step === 'info' ? 'datetime' : 'service')} 
              className="absolute left-0 top-0 md:-left-12 !text-slate-500 hover:!text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl !bg-white shadow-sm border !border-slate-200 mb-2">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold !text-[#0f172a]">Agendar Horário</h1>
          <p className="text-sm !text-[#64748b]">
            {step === 'service' && 'Escolha o procedimento ideal para você.'}
            {step === 'datetime' && 'Escolha o profissional, dia e horário.'}
            {step === 'info' && 'Para finalizar, insira seus dados.'}
          </p>
        </div>

        {step === 'service' && (
          <div className="space-y-8 animate-fade-in">
            {Object.entries(groupedServices).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-bold !text-[#475569] uppercase tracking-wider mb-3 pl-1 border-l-4 border-primary/50 ml-1">
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {items.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setStep('datetime');
                        setSelectedProfessional(null);
                        setSelectedDate('');
                        setSelectedTime('');
                      }}
                      className="group relative flex items-start p-5 !bg-white rounded-xl border !border-slate-200 shadow-sm hover:!border-primary/50 hover:shadow-md transition-all text-left w-full"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-bold !text-[#0f172a] text-lg group-hover:!text-primary transition-colors">
                             {service.name}
                           </h3>
                           {service.price && (
                             <span className="font-bold !text-[#1e293b] !bg-slate-100 px-2 py-1 rounded text-sm whitespace-nowrap ml-2">
                               R$ {service.price.toFixed(2)}
                             </span>
                           )}
                        </div>
                        {service.description && (
                          <p className="text-sm !text-[#475569] mt-1 leading-relaxed line-clamp-2 font-medium">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs !text-[#64748b] mt-3 font-semibold">
                          <span className="flex items-center !bg-slate-50 px-2 py-1 rounded">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className="mt-1">
                         <div className="w-8 h-8 rounded-full !bg-slate-50 flex items-center justify-center group-hover:!bg-primary group-hover:!text-white transition-all text-slate-400">
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                         </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 'datetime' && (
          <div className="!bg-white rounded-2xl border !border-slate-200 shadow-lg p-6 animate-fade-in space-y-8">
            <div>
              <label className="text-sm font-bold !text-[#0f172a] mb-3 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                Selecione o Profissional
              </label>
              
              {(!professionals || professionals.length === 0) ? (
                 <p className="text-sm text-red-500">Nenhum profissional disponível.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professionals.map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfessional(prof);
                        setSelectedDate('');
                        setSelectedTime('');
                      }}
                      className={`
                        p-3 rounded-xl border text-left transition-all flex flex-col justify-center
                        ${selectedProfessional?.id === prof.id 
                          ? '!bg-primary !text-white !border-primary shadow-md transform scale-[1.02]' 
                          : '!bg-white !text-slate-600 !border-slate-200 hover:!border-primary/50 hover:!bg-slate-50'}
                      `}
                    >
                      <span className="font-bold text-sm">{prof.name}</span>
                      <span className={`text-[10px] uppercase font-bold mt-1 inline-block px-1.5 py-0.5 rounded w-fit
                         ${selectedProfessional?.id === prof.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {prof.capacity > 1 ? `${prof.capacity} Vagas/Horário` : 'Atendimento Exclusivo'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProfessional && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <label className="text-sm font-bold !text-[#0f172a] mb-3 block">Selecione o dia</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {getAvailableDates().map((date) => (
                      <button
                        key={date}
                        onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime('');
                        }}
                        className={`
                          p-2 rounded-lg text-sm font-medium border transition-all
                          ${selectedDate === date 
                            ? '!bg-primary !text-white !border-primary shadow-md transform scale-105' 
                            : '!bg-white !text-[#475569] !border-slate-200 hover:!border-primary/50 hover:!bg-slate-50'}
                        `}
                      >
                        <span className="block text-[10px] opacity-90 uppercase mb-0.5">{format(parseISO(date), 'EEE', { locale: ptBR })}</span>
                        <span className="block text-xl font-bold">{format(parseISO(date), 'dd')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div className="animate-fade-in">
                    <label className="text-sm font-bold !text-[#0f172a] mb-3 block">
                      Horários disponíveis para {selectedProfessional.name.split(' ')[0]}
                    </label>
                    
                    {getAvailableTimeSlots().length === 0 ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
                           Agenda lotada ou indisponível para esta data.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                          {getAvailableTimeSlots().map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`
                                py-2.5 px-1 rounded-lg text-sm transition-all border font-semibold
                                ${selectedTime === time 
                                  ? '!bg-primary !text-white !border-primary shadow-md' 
                                  : '!bg-white !text-[#475569] !border-slate-200 hover:!bg-slate-50 hover:!border-slate-300'}
                              `}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-4 shadow-lg" 
              disabled={!selectedDate || !selectedTime || !selectedProfessional}
              onClick={handleDateTimeConfirm}
            >
              Continuar Agendamento
            </Button>
          </div>
        )}

        {step === 'info' && (
          <Card className="p-6 animate-fade-in border-0 shadow-xl !bg-white">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="!bg-slate-50 p-5 rounded-xl border !border-slate-100">
                <h3 className="font-bold !text-[#0f172a] mb-4 text-sm uppercase tracking-wide border-b !border-slate-200 pb-2">Resumo do Pedido</h3>
                <div className="space-y-3">
                   <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold !text-[#0f172a] text-lg block">{selectedService?.name}</span>
                        {selectedService?.description && <span className="text-xs !text-[#64748b] block mt-1 font-medium">{selectedService.description}</span>}
                      </div>
                      <span className="font-bold text-primary text-lg">R$ {selectedService?.price?.toFixed(2)}</span>
                   </div>
                   
                   <div className="!bg-white p-2 rounded border !border-slate-200 flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs !text-[#64748b] font-semibold">Profissional:</span>
                      <span className="font-bold !text-[#0f172a] text-sm">{selectedProfessional?.name}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="!bg-white p-2 rounded border !border-slate-200">
                          <span className="text-xs !text-[#64748b] block font-semibold">Data</span>
                          <span className="font-bold !text-[#0f172a] capitalize text-sm">{selectedDate && format(parseISO(selectedDate), "EEE, dd/MM", { locale: ptBR })}</span>
                      </div>
                      <div className="!bg-white p-2 rounded border !border-slate-200">
                          <span className="text-xs !text-[#64748b] block font-semibold">Horário</span>
                          <span className="font-bold !text-[#0f172a] text-sm">{selectedTime}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold !text-[#0f172a] mb-1.5 block">Seu Nome Completo</label>
                  <Input 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)} 
                    placeholder="Ex: Maria Silva" 
                    required 
                    className="!bg-white !border-slate-300 !text-[#0f172a] h-11 placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="text-sm font-bold !text-[#0f172a] mb-1.5 block">Seu WhatsApp</label>
                  <Input 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value)} 
                    placeholder="(11) 99999-9999" 
                    required 
                    className="!bg-white !border-slate-300 !text-[#0f172a] h-11 placeholder:text-slate-400" 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-base shadow-lg mt-2" disabled={createAppointmentMutation.isPending}>
                {createAppointmentMutation.isPending ? 'Confirmando...' : 'Confirmar Agendamento'}
              </Button>
            </form>
          </Card>
        )}

        {step === 'success' && (
          <Card className="p-8 text-center animate-fade-in !bg-white border !border-green-100 shadow-2xl">
             <div className="w-20 h-20 rounded-full !bg-green-50 flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/50">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3 !text-[#0f172a]">Agendado com Sucesso!</h2>
            <p className="!text-[#475569] mb-8 leading-relaxed">
              Tudo certo, <strong className="!text-[#0f172a]">{clientName.split(' ')[0]}</strong>.<br/>
              Seu horário com <span className="font-bold">{selectedProfessional?.name}</span> está confirmado.<br/>
              Nos vemos no dia <span className="text-primary font-bold">{format(parseISO(selectedDate), "dd/MM")}</span> às <span className="text-primary font-bold">{selectedTime}</span>.
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full !border-slate-200 !text-[#06f706] hover:!bg-slate-50 h-11" onClick={() => window.open(generateGoogleCalendarUrl(selectedService?.name || '', selectedDate, selectedTime, selectedService?.duration_minutes || 60), '_blank')}>
                <Calendar className="w-4 h-4 mr-2" /> Adicionar à Agenda
              </Button>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11" onClick={() => window.location.reload()}>
                Fazer outro agendamento
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}