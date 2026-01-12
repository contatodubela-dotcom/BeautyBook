import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sparkles, Calendar, Clock, CheckCircle, ArrowLeft, Star, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Service, AvailabilitySetting } from '../types';
import { useTranslation } from 'react-i18next';

// --- TIPAGEM ---
interface BusinessProfile {
  user_id: string;
  business_name: string;
  banner_url: string | null;
  slug: string | null;
}

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
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceName)}&dates=${formatDate(start)}/${formatDate(end)}&details=Agendamento+confirmado`;
};

// --- WRAPPER (LÓGICA DE BUSCA) ---
export default function BookingPage() {
  const params = useParams();
  const paramId = params.userId; // Rota: /book/:userId
  const paramSlug = params.slug; // Rota: /:slug

  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<BusinessProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function resolveProfile() {
      setLoadingProfile(true);
      console.log("Iniciando busca...", { paramId, paramSlug });

      try {
        let query = supabase.from('business_profiles').select('*');

        // LÓGICA DE DECISÃO
        if (paramSlug) {
          // Busca exata pelo slug (ignorando maiúsculas/minúsculas se o banco permitir, mas aqui forçamos exato)
          // Dica: No passo anterior do SQL, forçamos 'empilhaplus' tudo minúsculo no banco.
          query = query.eq('slug', paramSlug.toLowerCase());
        } else if (paramId) {
          query = query.eq('user_id', paramId);
        } else {
          console.log("Nenhum parâmetro de busca encontrado.");
          setLoadingProfile(false);
          return;
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error("Erro no Supabase:", error);
        }

        if (data) {
          console.log("Perfil encontrado:", data);
          setResolvedUserId(data.user_id);
          setProfileData(data as BusinessProfile);
        } else {
          console.warn("Nenhum perfil retornado do banco.");
        }

      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    resolveProfile();
  }, [paramId, paramSlug]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!resolvedUserId || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-slate-500">
        <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold">Página não encontrada</h2>
        <p className="mb-4">Não encontramos um estabelecimento neste endereço.</p>
        <div className="bg-slate-200 p-4 rounded text-xs font-mono text-slate-600">
           Debug: {paramSlug ? `Slug: ${paramSlug}` : `ID: ${paramId}`}
        </div>
      </div>
    );
  }

  return <BookingContent userId={resolvedUserId} profile={profileData} />;
}

// --- CONTEÚDO (MANTIDO IGUAL, SÓ TRADUÇÃO) ---
function BookingContent({ userId, profile }: { userId: string, profile: BusinessProfile }) {
  const { t, i18n } = useTranslation();
  
  // Helpers
  const dateLocale = i18n.language === 'en' ? enUS : ptBR;
  const currencyCode = i18n.language === 'en' ? 'USD' : 'BRL';
  const formatPrice = (price: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: currencyCode }).format(price);

  const [step, setStep] = useState<'service' | 'datetime' | 'info' | 'success'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const businessName = profile.business_name || t('booking.default_business_name');
  const bannerUrl = profile.banner_url;

  // QUERIES
  const { data: services } = useQuery({
    queryKey: ['public-services', userId],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*').eq('user_id', userId).eq('is_active', true).order('price');
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

  const { data: professionals } = useQuery({
    queryKey: ['public-professionals', userId],
    queryFn: async () => {
      const { data } = await supabase.from('professionals').select('*').eq('user_id', userId).eq('is_active', true);
      return data as Professional[] || [];
    },
  });

  const { data: availability } = useQuery({
    queryKey: ['public-availability', userId],
    queryFn: async () => {
      const { data } = await supabase.from('availability_settings').select('*').eq('user_id', userId).eq('is_active', true);
      return data as AvailabilitySetting[];
    },
  });

  const { data: appointmentCounts } = useQuery({
    queryKey: ['appointments-count', userId, selectedDate, selectedProfessional?.id],
    queryFn: async () => {
      if (!selectedDate || !selectedProfessional) return {};
      const { data } = await supabase.from('appointments').select('appointment_time').eq('user_id', userId).eq('professional_id', selectedProfessional.id).eq('appointment_date', selectedDate).in('status', ['pending', 'confirmed']);
      const counts: Record<string, number> = {};
      data?.forEach((app: any) => { const timeKey = app.appointment_time.slice(0, 5); counts[timeKey] = (counts[timeKey] || 0) + 1; });
      return counts;
    },
    enabled: !!selectedDate && !!selectedProfessional,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      let clientId;
      const { data: existingClient } = await supabase.from('clients').select('id').eq('phone', clientPhone).single();
      if (existingClient) clientId = existingClient.id;
      else {
        const { data: newClient, error } = await supabase.from('clients').insert({ name: clientName, phone: clientPhone }).select().single();
        if (error) throw error; clientId = newClient.id;
      }
      
      const { data: blocked } = await supabase.from('blocked_clients').select('id').eq('user_id', userId).eq('client_id', clientId).maybeSingle();
      if (blocked) throw new Error('Blocked');

      const { error } = await supabase.from('appointments').insert({ user_id: userId, client_id: clientId, service_id: selectedService!.id, professional_id: selectedProfessional!.id, appointment_date: selectedDate, appointment_time: selectedTime, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => setStep('success'),
    onError: () => toast.error(t('auth.error_generic')),
  });

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      const dayOfWeek = date.getDay();
      const hasAvailability = availability?.some(a => a.day_of_week === dayOfWeek);
      if (hasAvailability) dates.push(format(date, 'yyyy-MM-dd'));
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
    let loopHour = startHour; let loopMinute = startMinute;

    while (loopHour < endHour || (loopHour === endHour && loopMinute < endMinute)) {
      const timeString = `${String(loopHour).padStart(2, '0')}:${String(loopMinute).padStart(2, '0')}`;
      let isPast = false;
      if (isToday && (loopHour < currentHour || (loopHour === currentHour && loopMinute <= currentMinute))) isPast = true;
      const currentCount = appointmentCounts?.[timeString] || 0;
      const capacity = selectedProfessional.capacity || 1;
      if (!isPast && currentCount < capacity) slots.push(timeString);
      loopMinute += 30;
      if (loopMinute >= 60) { loopMinute = 0; loopHour++; }
    }
    return slots;
  };

  const handleDateTimeConfirm = () => { if (selectedDate && selectedTime && selectedProfessional) setStep('info'); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createAppointmentMutation.mutate(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbf0] via-[#fff5f5] to-[#fff0f0] flex flex-col items-center justify-start pb-12 font-sans text-slate-900">
      
      {/* Botões de Idioma */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
         <button onClick={() => i18n.changeLanguage('pt')} className="text-xs bg-white/50 p-2 rounded-full hover:bg-white transition">🇧🇷</button>
         <button onClick={() => i18n.changeLanguage('en')} className="text-xs bg-white/50 p-2 rounded-full hover:bg-white transition">🇺🇸</button>
      </div>

      {/* BANNER */}
      <div 
        className={`w-full h-64 md:h-80 shadow-lg bg-cover bg-center relative transition-all duration-500 ${!bannerUrl ? 'bg-gradient-to-r from-amber-200 to-orange-100' : ''}`}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      <div className="w-full max-w-lg px-4 -mt-32 relative z-10">
        
        {/* CABEÇALHO */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 mb-8 text-center border border-white/50 relative overflow-hidden">
          <div className="w-28 h-28 bg-white rounded-full mx-auto -mt-20 flex items-center justify-center shadow-2xl border-4 border-white">
             <div className="w-full h-full rounded-full bg-[#fffbf0] flex items-center justify-center overflow-hidden">
                <Sparkles className="w-12 h-12 text-[#d4af37]" />
             </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mt-4 tracking-tight">{businessName}</h1>
          <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-2 uppercase tracking-widest font-medium">
            <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
            {t('booking.premium_exp')}
          </p>

          {step !== 'success' && step !== 'service' && (
            <button onClick={() => setStep(step === 'info' ? 'datetime' : 'service')} className="absolute top-4 left-4 text-slate-400 hover:text-[#d4af37] transition-colors bg-white/80 p-2 rounded-full hover:bg-white shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="space-y-8">
          <div className="text-center">
             <h2 className="text-xl font-medium text-slate-700">
                {step === 'service' && t('booking.step_service')}
                {step === 'datetime' && t('booking.step_date')}
                {step === 'info' && t('booking.step_info')}
                {step === 'success' && t('booking.step_success')}
             </h2>
             <div className="h-0.5 w-16 bg-[#d4af37]/30 mx-auto rounded-full mt-3"></div>
          </div>

          {step === 'service' && (
            <div className="space-y-8 animate-fade-in">
              {Object.entries(groupedServices).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span> {category}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {items.map((service) => (
                      <button key={service.id} onClick={() => { setSelectedService(service); setStep('datetime'); setSelectedProfessional(null); setSelectedDate(''); setSelectedTime(''); }} className="group relative flex items-center p-5 bg-white rounded-2xl border border-[#f5f0e6] shadow-sm hover:border-[#d4af37]/30 hover:shadow-lg transition-all text-left w-full overflow-hidden">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-slate-800 text-lg group-hover:text-[#d4af37] transition-colors">{service.name}</span>
                             {service.price && <span className="font-medium text-slate-900 bg-[#fffbf0] px-3 py-1 rounded-full text-sm border border-[#f5f0e6]">{formatPrice(service.price)}</span>}
                          </div>
                          {service.description && <p className="text-sm text-slate-500 leading-relaxed mt-1">{service.description}</p>}
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 font-medium">
                            <Clock className="w-3.5 h-3.5" /> {service.duration_minutes} {t('booking.minutes_session')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ... MANTENHA O RESTO DOS PASSOS (DATETIME, INFO, SUCCESS) IGUAIS ... */}
          {/* Para economizar espaço, o restante da lógica de passos é idêntica ao arquivo anterior que estava correto. */}
          {/* O IMPORTANTE FOI O useEffect NO TOPO */}
          
          {step === 'datetime' && (
            <div className="bg-white rounded-3xl border border-[#f5f0e6] shadow-xl p-6 animate-fade-in space-y-8">
              <div>
                <label className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">{t('booking.label_prof')}</label>
                {(!professionals || professionals.length === 0) ? (
                   <p className="text-sm text-red-500">{t('booking.no_prof')}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {professionals.map((prof) => (
                      <button key={prof.id} onClick={() => { setSelectedProfessional(prof); setSelectedDate(''); setSelectedTime(''); }} className={`p-4 rounded-xl border text-left transition-all relative ${selectedProfessional?.id === prof.id ? 'bg-[#fffbf0] border-[#d4af37] text-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-100 hover:border-[#d4af37]/30'}`}>
                        <div className="flex items-center justify-between"><span className="font-bold text-sm">{prof.name}</span>{selectedProfessional?.id === prof.id && <CheckCircle className="w-5 h-5 text-[#d4af37]" />}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProfessional && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-4 block uppercase tracking-wide">{t('booking.label_date')}</label>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {getAvailableDates().map((date) => (
                        <button key={date} onClick={() => { setSelectedDate(date); setSelectedTime(''); }} className={`min-w-[5rem] p-4 rounded-2xl flex flex-col items-center justify-center transition-all border ${selectedDate === date ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform -translate-y-1' : 'bg-white text-slate-400 border-slate-100 hover:border-[#d4af37]/50'}`}>
                          <span className="text-[10px] uppercase font-bold mb-1 opacity-80">{format(parseISO(date), 'EEE', { locale: dateLocale })}</span>
                          <span className="text-2xl font-black">{format(parseISO(date), 'dd')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedDate && (
                    <div className="animate-fade-in">
                      <label className="text-sm font-bold text-slate-900 mb-4 block uppercase tracking-wide">{t('booking.label_time')}</label>
                      {getAvailableTimeSlots().length === 0 ? <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">{t('booking.no_slots')}</div> : 
                          <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {getAvailableTimeSlots().map((time) => (
                              <button key={time} onClick={() => setSelectedTime(time)} className={`py-3 rounded-xl text-sm font-bold transition-all border ${selectedTime === time ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-[#d4af37] hover:text-[#d4af37]'}`}>{time}</button>
                            ))}
                          </div>
                      }
                    </div>
                  )}
                </div>
              )}
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-xl shadow-xl text-lg mt-6" disabled={!selectedDate || !selectedTime || !selectedProfessional} onClick={handleDateTimeConfirm}>{t('booking.btn_continue')}</Button>
            </div>
          )}

          {step === 'info' && (
            <Card className="p-0 animate-fade-in border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
              <div className="bg-[#fffbf0] p-6 border-b border-[#f5f0e6]">
                  <h3 className="font-bold text-[#d4af37] mb-4 text-xs uppercase tracking-widest">{t('booking.summary_title')}</h3>
                  <div className="flex justify-between items-start mb-2">
                     <div><span className="font-playfair font-bold text-slate-900 text-2xl block">{selectedService?.name}</span><span className="text-sm text-slate-500 block mt-1">{t('booking.prof_prefix')} {selectedProfessional?.name}</span></div>
                     <span className="font-bold text-slate-900 text-xl">{selectedService?.price ? formatPrice(selectedService.price) : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 mt-4 bg-white/50 p-3 rounded-lg w-fit"><Calendar className="w-4 h-4" /><span className="capitalize font-medium">{selectedDate && format(parseISO(selectedDate), "EEE, dd/MM", { locale: dateLocale })}</span><span className="mx-1">•</span><span>{selectedTime}</span></div>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('booking.label_name')}</label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t('booking.placeholder_name')} required className="bg-slate-50 border-slate-200 h-14 rounded-xl focus:ring-[#d4af37] !text-slate-900 placeholder:text-slate-400" /></div>
                  <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('booking.label_phone')}</label><Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t('booking.placeholder_phone')} required className="bg-slate-50 border-slate-200 h-14 rounded-xl focus:ring-[#d4af37] !text-slate-900 placeholder:text-slate-400" /></div>
                </div>
                <Button type="submit" className="w-full bg-[#d4af37] hover:bg-[#c5a028] text-white font-bold h-14 rounded-xl shadow-lg text-lg" disabled={createAppointmentMutation.isPending}>{createAppointmentMutation.isPending ? t('booking.btn_confirming') : t('booking.btn_confirm')}</Button>
              </form>
            </Card>
          )}

          {step === 'success' && (
            <Card className="p-10 text-center animate-fade-in bg-white border-0 shadow-2xl rounded-3xl">
               <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/30"><CheckCircle className="w-12 h-12 text-green-600" /></div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900 tracking-tight">{t('booking.success_title')}</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">{t('booking.success_msg', { name: clientName.split(' ')[0], service: selectedService?.name })}</p>
              <div className="space-y-3">
                <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 h-14 rounded-xl" onClick={() => window.open(generateGoogleCalendarUrl(selectedService?.name || '', selectedDate, selectedTime, selectedService?.duration_minutes || 60), '_blank')}><Calendar className="w-4 h-4 mr-2" /> {t('booking.btn_calendar')}</Button>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-xl" onClick={() => window.location.reload()}>{t('booking.btn_new')}</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}