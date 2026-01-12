import { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; 
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next'; // <--- IMPORTADO AQUI
import { Calendar, LayoutDashboard, Settings, Sparkles, Users, ClipboardList, Share2, LogOut, FileBarChart } from 'lucide-react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import CalendarView from '../components/dashboard/CalendarView';
import ServicesManager from '../components/dashboard/ServicesManager';
import AvailabilitySettings from '../components/dashboard/AvailabilitySettings';
import ClientsManager from '../components/dashboard/ClientsManager';
import ReportsView from '../components/dashboard/ReportsView';
import ProfessionalsManager from '../components/dashboard/ProfessionalsManager';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/use-mobile';
import { toast } from 'sonner';

type TabType = 'overview' | 'calendar' | 'services' | 'availability' | 'clients' | 'reports' | 'professionals';

export default function DashboardPage() {
  const { t, i18n } = useTranslation(); // <--- HOOK DE TRADUÇÃO
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  // Função para trocar de língua
  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  const tabs = [
    { id: 'overview' as TabType, label: t('dashboard.tabs.overview'), icon: LayoutDashboard },
    { id: 'calendar' as TabType, label: t('dashboard.tabs.calendar'), icon: Calendar },
    { id: 'services' as TabType, label: t('dashboard.tabs.services'), icon: ClipboardList },
    { id: 'professionals' as TabType, label: t('dashboard.tabs.team'), icon: Users },
    { id: 'clients' as TabType, label: t('dashboard.tabs.clients'), icon: Users },
    { id: 'reports' as TabType, label: t('dashboard.tabs.financial'), icon: FileBarChart },
    { id: 'availability' as TabType, label: t('dashboard.tabs.settings'), icon: Settings },
  ];

  const { data: profile } = useQuery({
    queryKey: ['my-business-profile', user?.id],
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

  const handleShareUrl = () => {
    if (!user?.id) return;
    
    const baseUrl = window.location.origin;
    const url = profile?.slug 
      ? `${baseUrl}/${profile.slug}` 
      : `${baseUrl}/book/${user.id}`;

    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copiado: ' + url);
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6 print:bg-white print:pb-0 text-foreground">
      
      {/* HEADER */}
      <header className="bg-card border-b border-white/10 sticky top-0 z-50 print:hidden backdrop-blur-md bg-opacity-90">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(246,173,85,0.2)]">
                <Sparkles className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-white">BeautyBook</h1>
                {!isMobile && <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">{user?.username || 'Profissional'}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* BOTÃO DE IDIOMA NOVO */}
              <Button 
                onClick={toggleLanguage} 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-gray-400 hover:text-white"
              >
                {i18n.language === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
              </Button>

              <Button 
                onClick={handleShareUrl}
                variant="outline" 
                size="sm" 
                className="gap-2 border-primary/30 hover:bg-primary hover:text-gray-900 text-primary h-9 transition-all bg-transparent"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.link_btn')}</span>
              </Button>

              <Button variant="ghost" onClick={logout} size="icon" className="h-9 w-9 text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ABAS (DESKTOP) */}
      <div className="hidden md:block border-b border-white/10 bg-background sticky top-[73px] z-40 print:hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 text-sm font-medium transition-all relative
                    ${activeTab === tab.id
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(246,173,85,0.5)] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="container max-w-6xl mx-auto px-4 py-8 animate-fade-in print:p-0 print:max-w-none">
        <div className="min-h-[500px]">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'services' && <ServicesManager />}
          {activeTab === 'professionals' && <ProfessionalsManager />}
          {activeTab === 'clients' && <ClientsManager />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'availability' && <AvailabilitySettings />}
        </div>
      </main>

      {/* MENU MOBILE */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#112240]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 pb-safe print:hidden">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`
                  flex flex-col items-center justify-center p-1 rounded-xl transition-all w-full
                  ${isActive 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={2} />
                <span className="text-[9px] font-medium leading-none text-center">
                  {/* Lógica para encurtar nome no mobile, se necessário */}
                  {tab.id === 'overview' ? (i18n.language === 'pt' ? 'Início' : 'Home') : tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}