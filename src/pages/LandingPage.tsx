import { Link } from 'react-router-dom';
import { Scissors, Sparkles, Heart, Palette, ChevronRight, BarChart3, Calendar, CheckCircle2, Bell, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#020617] text-foreground selection:bg-primary selection:text-[#020617] overflow-x-hidden">
      
      {/* --- BACKGROUND FX (Grid Pattern) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>

      {/* --- HERO SECTION --- */}
      <header className="relative py-20 lg:py-32 flex items-center justify-center overflow-hidden">
        
        {/* Glow de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/15 blur-[120px] rounded-full pointer-events-none opacity-60 animate-pulse"></div>

        <div className="container relative z-10 px-4 mx-auto text-center space-y-8 animate-fade-in">
          
          {/* Badge Superior */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-md shadow-lg hover:bg-white/10 transition-colors cursor-default">
            <Sparkles className="w-3 h-3 fill-current" /> Gestão Inteligente & Financeiro
          </div>

          {/* Título Principal */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white drop-shadow-2xl">
            Sua agenda cheia. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-400 to-amber-500">
              Seu negócio no azul.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            A plataforma completa para salões e clínicas eliminarem o "no-show", automatizarem o financeiro e fidelizarem clientes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 hover:scale-105 transition-all rounded-full shadow-[0_0_40px_rgba(245,158,11,0.3)] border-0">
                Começar Grátis Agora <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          <p className="text-xs text-slate-500 font-medium tracking-wide">TESTE GRÁTIS DE 7 DIAS • SEM CARTÃO DE CRÉDITO</p>
        </div>
      </header>

      {/* --- MOCKUP DA INTERFACE "VIVA" (Corrigido) --- */}
      <div className="container mx-auto px-4 mb-32 relative z-10">
        
        {/* Wrapper Relativo para posicionar os flutuantes FORA do overflow hidden */}
        <div className="relative max-w-6xl mx-auto">

            {/* --- ELEMENTOS FLUTUANTES (Agora fora da caixa principal) --- */}
            
            {/* Notificação 1 (Esquerda) */}
            <div className="absolute -left-4 lg:-left-12 top-20 z-30 hidden lg:flex items-center gap-3 p-4 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl animate-bounce backdrop-blur-md" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shadow-lg shadow-green-500/10">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Novo Agendamento</p>
                    <p className="text-sm font-bold text-white">Julia Silva confirmou</p>
                </div>
            </div>

            {/* Notificação 2 (Direita) */}
            <div className="absolute -right-4 lg:-right-12 bottom-32 z-30 hidden lg:flex items-center gap-3 p-4 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl animate-bounce backdrop-blur-md" style={{ animationDuration: '4s' }}>
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Receita Hoje</p>
                    <p className="text-sm font-bold text-emerald-400">+ R$ 450,00</p>
                </div>
            </div>

            {/* --- O MOCKUP PRINCIPAL --- */}
            <div className="relative rounded-2xl bg-[#0f172a] border border-slate-700/50 p-2 shadow-2xl group transform hover:scale-[1.005] transition-transform duration-700 ring-1 ring-white/10 overflow-hidden z-20">
            
                {/* Barra de Título (Browser) */}
                <div className="bg-[#020617] border-b border-white/5 h-10 flex items-center px-4 gap-2 rounded-t-xl">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="ml-4 h-5 w-64 bg-white/5 rounded text-[10px] text-slate-500 flex items-center px-3 font-mono border border-white/5">
                        https://app.beautybook.com/dashboard
                    </div>
                </div>

                {/* Corpo do Mockup */}
                <div className="grid grid-cols-12 h-[500px] bg-[#020617] rounded-b-xl overflow-hidden relative">
                    
                    {/* Efeito de Luz Interna */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] pointer-events-none rounded-full"></div>

                    {/* SIDEBAR */}
                    <div className="col-span-2 hidden md:flex flex-col border-r border-white/5 bg-[#0f172a]/50 p-4 gap-6">
                        <div className="flex items-center gap-3 mb-2 px-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg shadow-lg shadow-orange-500/20"></div>
                            <div className="h-2 w-16 bg-slate-600 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-9 w-full bg-primary/10 border-l-2 border-amber-500 rounded-r flex items-center px-3 gap-3 text-amber-500">
                                <BarChart3 size={16} />
                                <div className="h-1.5 w-16 bg-amber-500/50 rounded-full"></div>
                            </div>
                            {[1,2,3].map(i => (
                                <div key={i} className="h-9 w-full flex items-center px-3 gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                                    <div className="w-4 h-4 bg-slate-500 rounded-sm"></div>
                                    <div className="h-1.5 w-12 bg-slate-500 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DASHBOARD CONTENT */}
                    <div className="col-span-12 md:col-span-10 p-6 relative z-10">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <div className="h-6 w-48 bg-slate-700/50 rounded mb-2 animate-pulse"></div>
                                <div className="h-3 w-32 bg-slate-800 rounded"></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                                    <Bell size={16} className="text-slate-400" />
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg"></div>
                            </div>
                        </div>

                        {/* Widgets */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            {/* Card Principal - Gráfico */}
                            <div className="col-span-2 p-6 rounded-2xl bg-[#1e293b]/50 border border-white/5 shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Faturamento Semanal</p>
                                        <h3 className="text-2xl font-bold text-white mt-1">R$ 4.250,00</h3>
                                    </div>
                                    <div className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full font-bold">+ 12.5%</div>
                                </div>
                                
                                {/* Barras do Gráfico */}
                                <div className="flex items-end gap-3 h-24 mt-4">
                                    {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                        <div key={i} className="w-full bg-slate-700/50 rounded-t-sm relative group/bar">
                                            <div style={{ height: `${h}%` }} className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ${i === 3 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-600 group-hover/bar:bg-slate-500'}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Card Secundário */}
                            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/5 shadow-xl flex flex-col justify-between group">
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                                        <Calendar size={20}/>
                                    </div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Hoje</p>
                                    <h3 className="text-xl font-bold text-white mt-1">8 Agendamentos</h3>
                                </div>
                                <div className="w-full bg-slate-700/30 rounded-full h-1.5 mt-4">
                                    <div className="bg-orange-500 h-1.5 rounded-full w-[70%] shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Lista Inferior */}
                        <div className="rounded-2xl bg-[#1e293b]/50 border border-white/5 p-6 shadow-xl">
                            <div className="flex justify-between mb-4">
                                <div className="h-4 w-32 bg-slate-700/50 rounded"></div>
                                <div className="h-4 w-4 bg-slate-700/50 rounded"></div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-700/50"></div>
                                            <div className="space-y-1.5">
                                                <div className="h-2.5 w-32 bg-slate-400 rounded-full"></div>
                                                <div className="h-2 w-20 bg-slate-600 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">CONFIRMADO</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- QUEM PODE USAR (Interactive Grid) --- */}
      <section className="py-24 bg-[#0B1120] relative border-t border-white/5">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Feito para o <span className="text-amber-500">seu sucesso</span></h2>
            <p className="text-slate-400 text-lg">Ferramentas adaptadas para escalar o seu negócio.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Scissors, label: "Salões de Beleza", color: "text-pink-500", bg: "bg-pink-500/10", border: "group-hover:border-pink-500/50" },
              { icon: Palette, label: "Esmalterias", color: "text-purple-500", bg: "bg-purple-500/10", border: "group-hover:border-purple-500/50" },
              { icon: Sparkles, label: "Clínicas de Estética", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "group-hover:border-cyan-500/50" },
              { icon: Heart, label: "Spas & Bem-estar", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "group-hover:border-emerald-500/50" },
            ].map((item, idx) => (
              <div key={idx} className={`flex flex-col items-center text-center p-8 rounded-3xl bg-[#1e293b]/40 border border-white/5 transition-all duration-300 group cursor-default shadow-lg hover:shadow-2xl hover:-translate-y-2 ${item.border}`}>
                <div className={`w-20 h-20 rounded-full ${item.bg} flex items-center justify-center ${item.color} mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-inner`}>
                  <item.icon className="w-9 h-9" />
                </div>
                <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{item.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- RODAPÉ --- */}
      <footer className="bg-[#020617] py-12 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-[#020617] to-[#020617] pointer-events-none"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">BeautyBook</span>
          </div>
          <p className="text-slate-500 text-sm mb-8">
            © 2025 BeautyBook. Tecnologia para negócios de beleza.
          </p>
          <div className="flex justify-center gap-8 text-sm font-semibold">
            <Link to="/login" className="text-slate-400 hover:text-amber-500 transition-colors">Entrar</Link>
            <Link to="/signup" className="text-slate-400 hover:text-amber-500 transition-colors">Criar Conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}