import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Cpu, 
  Sparkles, 
  Share2, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Code, 
  Zap, 
  Check, 
  ArrowRight, 
  ChevronRight, 
  Play, 
  Terminal, 
  ExternalLink, 
  Menu, 
  X, 
  CheckCircle2, 
  MessageSquare, 
  Layers, 
  Globe, 
  History, 
  Users, 
  Settings, 
  Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AnimatedBackground from './components/AnimatedBackground';

// Interfaces for our component state
type SocialChannel = 'LinkedIn' | 'X / Twitter' | 'Instagram' | 'Dev.to';
type ToneType = 'Profissional' | 'Persuasivo' | 'Criativo' | 'Técnico';

export default function App() {
  // Navigation / Router States
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isAdmUser, setIsAdmUser] = useState(false);

  // Sync auth state observer
  useEffect(() => {
    // Check local storage bypass first
    const localU = localStorage.getItem('pilot_local_user');
    const localIsAdm = localStorage.getItem('pilot_local_is_adm') === 'true';
    if (localU) {
      setFirebaseUser(JSON.parse(localU));
      setIsAdmUser(localIsAdm);
      setCurrentView('dashboard');
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        let isAdm = user.email === 'pablo@agencia7zion.com.br';
        try {
          const uDoc = await getDoc(doc(db, 'users', user.uid));
          if (uDoc.exists()) {
            const uData = uDoc.data();
            if (uData.isAdmin || uData.plan === 'Admin') {
              isAdm = true;
            }
          }
        } catch (fErr) {
          console.warn("Firestore error reading admin status:", fErr);
        }
        setIsAdmUser(isAdm);
        setCurrentView('dashboard');
      } else if (!localStorage.getItem('pilot_local_user')) {
        setFirebaseUser(null);
        setIsAdmUser(false);
        setCurrentView(curr => curr === 'dashboard' ? 'landing' : curr);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userObj: any, isAdm: boolean) => {
    setFirebaseUser(userObj);
    setIsAdmUser(isAdm);
    // Persist in local storage for absolute robustness in test sandboxes
    localStorage.setItem('pilot_local_user', JSON.stringify(userObj));
    localStorage.setItem('pilot_local_is_adm', isAdm ? 'true' : 'false');
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Auth signOut error, cleaning states locally:", err);
    }
    setFirebaseUser(null);
    setIsAdmUser(false);
    localStorage.removeItem('pilot_local_user');
    localStorage.removeItem('pilot_local_is_adm');
    setCurrentView('landing');
  };

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Playground state
  const [topic, setTopic] = useState('Estratégias de Growth Hacking para SaaS bootstrap em 2026');
  const [activeChannel, setActiveChannel] = useState<SocialChannel>('LinkedIn');
  const [activeTone, setActiveTone] = useState<ToneType>('Persuasivo');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [textTyped, setTextTyped] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [channelsConnected, setChannelsConnected] = useState({
    linkedin: true,
    twitter: false,
    instagram: false,
    dev: false
  });

  // Target audience selection
  const [selectedAudience, setSelectedAudience] = useState<'creators' | 'agencies' | 'startups'>('startups');

  // Interactive "Onde Atuamos" active card
  const [activeOndeTab, setActiveOndeTab] = useState<SocialChannel>('LinkedIn');

  // Contact form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('demonstracao');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Generate content using local server API
  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGeneratedText('');
    setTextTyped('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: topic,
          channel: activeChannel,
          tone: activeTone
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setGeneratedText(data.text);
      } else {
        throw new Error(data.error || 'Erro na resposta do servidor.');
      }
    } catch (err) {
      console.error('Erro na geração:', err);
      // Fallback in case of server failure
      const fallback = `🚀 Estratégias de escala para sua marca!\n\nAcabamos de gerar este rascunho de contingência técnica sobre "${topic}".\n\nNavegar sem fricção requer tecnologia de ponta e automação em escala real.\n\n#SaaS #MarketingIA #PilotContent`;
      setGeneratedText(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulate typing effect when generated text changes
  useEffect(() => {
    if (!generatedText) return;

    let index = 0;
    const interval = setInterval(() => {
      setTextTyped((prev) => prev + generatedText.charAt(index));
      index++;
      if (index >= generatedText.length) {
        clearInterval(interval);
      }
    }, 4); // Fast typing simulation

    return () => clearInterval(interval);
  }, [generatedText]);

  // Simulate automatic channel publishing
  const handlePublishContent = () => {
    if (!textTyped) return;
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);
  };

  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onBackToHome={() => setCurrentView('landing')} />;
  }

  if (currentView === 'dashboard') {
    return <Dashboard user={firebaseUser} isAdm={isAdmUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-transparent font-sans text-neutral-slate antialiased overflow-x-hidden selection:bg-brand-cyan/30 selection:text-neutral-white relative">
      <AnimatedBackground />
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[30rem] ambient-gradient pointer-events-none z-0" />
      <div className="absolute top-[180vh] right-[10%] w-[30rem] h-[30rem] bg-brand-cyan/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[320vh] left-[5%] w-[35rem] h-[35rem] bg-brand-electric/5 rounded-full filter blur-[150px] pointer-events-none z-0" />

      {/* STICKY GLASSMORPHIC HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-cyan/10 bg-brand-deep/75 backdrop-blur-md transition-all duration-300">
        <div id="header-container" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
          
          {/* Logo / Brand */}
          <a href="#hero" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-electric text-neutral-white overflow-hidden glow-effect-cyan transition-transform group-hover:scale-105 duration-300">
              <Rocket className="h-4.5 w-4.5 text-neutral-white animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/40 to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-neutral-white tracking-wider text-xl">PILOT</span>
              <span className="text-[9px] text-brand-cyan font-semibold uppercase tracking-widest -mt-1">Content Co-piloto</span>
            </div>
          </a>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-8 justify-center">
            <a href="#onde-atuamos" className="text-sm font-medium text-neutral-slate hover:text-brand-cyan transition-colors duration-200">
              Onde Atuamos
            </a>
            <a href="#o-que-e" className="text-sm font-medium text-neutral-slate hover:text-brand-cyan transition-colors duration-200">
              O que é
            </a>
            <a href="#quem-somos" className="text-sm font-medium text-neutral-slate hover:text-brand-cyan transition-colors duration-200">
              Quem Somos
            </a>
            <a href="#publico" className="text-sm font-medium text-neutral-slate hover:text-brand-cyan transition-colors duration-200">
              Público-Alvo
            </a>
            <a href="#fale-conosco" className="text-sm font-medium text-neutral-slate hover:text-brand-cyan transition-colors duration-200">
              Fale Conosco
            </a>
          </nav>

          {/* CTAs Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="#sandbox" 
              className="px-4 py-2 text-sm font-semibold rounded-lg text-neutral-white hover:text-brand-cyan transition-colors duration-200"
            >
              Testar Sandbox
            </a>
            {firebaseUser ? (
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="px-4.5 py-2.5 text-sm font-semibold text-neutral-white bg-brand-electric hover:bg-brand-electric/90 active:scale-95 rounded-lg inline-flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-brand-electric/20 text-center hover:shadow-brand-electric/30 border border-brand-cyan/10 cursor-pointer"
              >
                Painel do Usuário
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('login')} 
                className="px-4.5 py-2.5 text-sm font-semibold text-neutral-white bg-brand-electric hover:bg-brand-electric/90 active:scale-95 rounded-lg inline-flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-brand-electric/20 text-center hover:shadow-brand-electric/30 border border-brand-cyan/15 cursor-pointer"
              >
                Login
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 md:hidden text-neutral-slate hover:text-brand-cyan transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-brand-cyan/10 bg-brand-deep/95 overflow-hidden"
            >
              <div className="flex flex-col gap-4 px-6 py-6 font-medium">
                <a 
                  href="#onde-atuamos" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base text-neutral-slate hover:text-brand-cyan transition-colors py-1 py-1"
                >
                  Onde Atuamos
                </a>
                <a 
                  href="#o-que-e" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base text-neutral-slate hover:text-brand-cyan transition-colors py-1"
                >
                  O que é
                </a>
                <a 
                  href="#quem-somos" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base text-neutral-slate hover:text-brand-cyan transition-colors py-1"
                >
                  Quem Somos
                </a>
                <a 
                  href="#publico" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base text-neutral-slate hover:text-brand-cyan transition-colors py-1"
                >
                  Público-Alvo
                </a>
                <a 
                  href="#fale-conosco" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base text-neutral-slate hover:text-brand-cyan transition-colors py-1"
                >
                  Fale Conosco
                </a>
                
                <div className="h-[1px] bg-brand-cyan/10 my-2" />
                
                <div className="flex flex-col gap-3">
                  <a 
                    href="#sandbox" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-sm font-semibold rounded-lg text-neutral-white border border-brand-cyan/20 hover:bg-brand-cyan/5 transition-colors"
                  >
                    Testar Sandbox
                  </a>
                  {firebaseUser ? (
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCurrentView('dashboard');
                      }}
                      className="py-3 text-center text-sm font-bold text-neutral-white bg-brand-electric hover:bg-brand-electric/95 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-md border border-brand-cyan/15 cursor-pointer"
                    >
                      Painel do Usuário
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCurrentView('login');
                      }}
                      className="py-3 text-center text-sm font-bold text-neutral-white bg-brand-electric hover:bg-brand-electric/95 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-md border border-brand-cyan/15 cursor-pointer"
                    >
                      Login
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 md:px-8 flex flex-col items-center text-center">
          
          {/* Tagline Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 px-4.5 py-1.5 text-xs font-semibold tracking-wide text-brand-cyan glow-effect-cyan"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
            <span>PLATAFORMA EDITORIAL INTELEGENTE EM LOTES</span>
          </motion.div>

          {/* Core Tagline / Main Header */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-4xl text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-neutral-white leading-[1.1]"
          >
            Crie, otimize e publique <br />
            <span className="bg-gradient-to-r from-neutral-white via-brand-cyan to-brand-electric bg-clip-text text-transparent">
              conteúdo de marca de excelência.
            </span>
            <br />
            Em escala global.
          </motion.h1>

          {/* Subtext description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 max-w-xl text-base sm:text-lg md:text-xl text-neutral-slate leading-relaxed font-normal"
          >
            Sua central integrada de rascunhos que gera canais editoriais ricos, de acordo com o tom de voz da sua marca e distribui automaticamente.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row gap-4.5 justify-center w-full max-w-md sm:max-w-none"
          >
            <a 
              href="#sandbox" 
              className="group px-7 py-4 text-base font-bold text-neutral-white bg-brand-electric hover:bg-brand-electric/90 active:scale-98 rounded-xl inline-flex items-center justify-center gap-2.5 shadow-lg shadow-brand-electric/25 transition-all duration-300 hover:shadow-brand-electric/40 hover:glow-effect-electric border border-brand-cyan/20"
            >
              Criar Post Grátis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 duration-200" />
            </a>
            <a 
              href="#o-que-e" 
              className="px-7 py-4 text-base font-bold text-neutral-white bg-brand-deep border border-brand-cyan/30 hover:border-brand-cyan/70 hover:bg-brand-cyan/5 rounded-xl inline-flex items-center justify-center gap-2.5 transition-all duration-300"
            >
              Como Funciona
              <Play className="h-4 w-4 text-brand-cyan" />
            </a>
          </motion.div>

          {/* Downward Arrow indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:block">
            <div className="animate-bounce p-2 bg-brand-deep border border-brand-cyan/10 rounded-full">
              <ChevronRight className="h-5 w-5 text-neutral-slate rotate-90" />
            </div>
          </div>
        </div>
      </section>

      {/* SANDBOX SECTION (INTERACTIVE PLAYGROUND) */}
      <section id="sandbox" className="relative py-12 md:py-20 z-10">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          
          {/* Header decorative divider line to look exactly like Lumina */}
          <div className="w-full flex items-center justify-center mb-16 relative">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />
            <div className="absolute px-5 bg-brand-deep rounded-full border border-brand-cyan/10 py-1 text-xs font-semibold text-brand-cyan tracking-widest uppercase">
              Demonstração ao Vivo
            </div>
          </div>

          <div className="mx-auto max-w-4xl text-center mb-10">
            <h2 className="text-2xl md:text-3.5xl font-extrabold text-neutral-white tracking-tight">
              Experimente a geração do <span className="text-brand-cyan">Pilot Co-piloto</span>
            </h2>
            <p className="mt-3 text-neutral-slate max-w-lg mx-auto text-sm md:text-base">
              Rascunhe tópicos importantes e customize o tom de voz. O Pilot adapta no formato e estrutura perfeita para cada rede social instantaneamente.
            </p>
          </div>

          {/* Interactive UI Sandbox Wrapper */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative border border-brand-cyan/20 rounded-2xl bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl glow-effect-cyan glow-effect-border"
          >
            
            {/* Header bar of sandbox element */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-cyan/15 bg-brand-deep/80">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs text-brand-cyan font-mono ml-4 hidden sm:inline-block uppercase tracking-wider">
                  dashboard_v1.0.4 // console_sandbox
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  API GEMINI ONLINE
                </span>
              </div>
            </div>

            {/* Main Interactive Interface Block Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              
              {/* Form Sidebar / Settings Section */}
              <div className="md:col-span-5 p-5 md:p-6 border-b md:border-b-0 md:border-r border-brand-cyan/15 bg-brand-deep/30">
                <form onSubmit={handleGenerateContent} className="space-y-5">
                  
                  {/* Topic field */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-white uppercase tracking-wider mb-2">
                      1. Qual será o assunto do Post?
                    </label>
                    <textarea 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      rows={3}
                      maxLength={180}
                      className="w-full text-sm rounded-xl border border-brand-cyan/15 bg-slate-950/80 px-4.5 py-3 text-neutral-white placeholder:text-neutral-slate/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 py-3 transition-colors resize-none"
                      placeholder="Ex: O papel das APIs no desenvolvimento moderno de SaaS..."
                    />
                    <div className="flex justify-between mt-1.5 text-[10px] text-neutral-slate/50">
                      <span>Mantenha sucinto para melhores resultados</span>
                      <span>{topic.length}/180 chars</span>
                    </div>
                  </div>

                  {/* Channel selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-white uppercase tracking-wider mb-2">
                      2. Canal de Veiculação
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { name: 'LinkedIn', icon: <Linkedin className="h-3.5 w-3.5" /> },
                        { name: 'X / Twitter', icon: <Twitter className="h-3.5 w-3.5" /> },
                        { name: 'Instagram', icon: <Instagram className="h-3.5 w-3.5" /> },
                        { name: 'Dev.to', icon: <Code className="h-3.5 w-3.5" /> }
                      ]).map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setActiveChannel(item.name as SocialChannel)}
                          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                            activeChannel === item.name 
                              ? 'bg-brand-electric/15 border-brand-electric text-neutral-white shadow-md' 
                              : 'bg-slate-950/40 border-brand-cyan/10 text-neutral-slate hover:border-brand-cyan/40 hover:text-neutral-white'
                          }`}
                        >
                          <span className={activeChannel === item.name ? 'text-brand-cyan' : 'text-neutral-slate'}>
                            {item.icon}
                          </span>
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone option selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-white uppercase tracking-wider mb-2">
                      3. Estilo e Tom de Voz
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Profissional', 'Persuasivo', 'Criativo', 'Técnico'] as ToneType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setActiveTone(t)}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg text-center border transition-all ${
                            activeTone === t 
                              ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold' 
                              : 'bg-slate-950/40 border-brand-cyan/5 text-neutral-slate/80 hover:text-neutral-white hover:border-brand-cyan/20'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trigger AI Action */}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide inline-flex items-center justify-center gap-2 transition-all ${
                      isGenerating 
                        ? 'bg-brand-cyan/25 cursor-not-allowed text-brand-cyan' 
                        : 'bg-brand-electric hover:bg-brand-electric/90 text-neutral-white active:scale-[0.98] shadow-md shadow-brand-electric/10 hover:shadow-brand-electric/20 text-center border border-brand-cyan/15 hover:glow-effect-electric'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                        Otimizando e Estruturando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 text-neutral-white" />
                        Gerar Rascunho do Post
                      </>
                    )}
                  </button>

                </form>
              </div>

              {/* Output Preview Terminal Screen */}
              <div className="md:col-span-7 p-5 md:p-6 bg-slate-950 flex flex-col justify-between">
                
                {/* Header indicators */}
                <div className="flex items-center justify-between pb-3.5 border-b border-brand-cyan/5 mb-4 text-xs font-mono">
                  <div className="flex items-center gap-2 text-brand-cyan/75">
                    <Terminal className="h-4 w-4" />
                    <span>visualizador_de_conteudo.log</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-slate/40">Destino:</span>
                    <span className="font-semibold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/15 text-[11px]">
                      {activeChannel}
                    </span>
                  </div>
                </div>

                {/* Simulated workspace typing screen */}
                <div className="flex-1 min-h-[220px] rounded-lg border border-brand-cyan/5 bg-slate-900/50 p-4 font-mono text-neutral-offwhite text-xs sm:text-sm overflow-y-auto leading-relaxed relative whitespace-pre-wrap select-text">
                  
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-brand-cyan/10 border-t-brand-cyan animate-spin" />
                        <Rocket className="h-5 w-5 text-brand-cyan animate-bounce" />
                      </div>
                      <span className="text-xs text-brand-cyan select-none uppercase tracking-widest font-bold">Processando vetores linguísticos...</span>
                    </div>
                  )}

                  {!textTyped && !isGenerating && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-neutral-slate/40 py-10 select-none">
                      <Zap className="h-10 w-10 text-brand-cyan/20 mb-3.5" />
                      <p className="font-semibold">Nenhum rascunho de post gerado</p>
                      <p className="text-[11px] mt-1.5 max-w-xs">Ajuste os parâmetros no formulário à esquerda e clique em "Gerar" para visualizar o piloto automático estruturando seu post.</p>
                    </div>
                  )}

                  {textTyped && (
                    <div className="text-neutral-offwhite">
                      {textTyped}
                      {textTyped.length < (generatedText || '').length && <span className="terminal-caret" />}
                    </div>
                  )}

                </div>

                {/* Dashboard operations actions footer */}
                {textTyped && !isGenerating && (
                  <div className="mt-4 pt-4 border-t border-brand-cyan/5 flex flex-col sm:flex-row items-center justify-between gap-4.5">
                    <div className="flex items-center gap-4 text-xs font-mono text-neutral-slate/50 w-full sm:w-auto justify-between sm:justify-start">
                      <span>Palavras: <strong className="text-neutral-white">{textTyped.split(/\s+/).length}</strong></span>
                      <span>Caracteres: <strong className="text-neutral-white">{textTyped.length}</strong></span>
                      <span>Leitura: <strong className="text-neutral-white">{Math.max(1, Math.ceil(textTyped.split(/\s+/).length / 200))} min</strong></span>
                    </div>

                    <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={handlePublishContent}
                        className="px-4 py-2.5 text-xs font-bold text-neutral-white bg-brand-electric hover:bg-brand-electric/95 hover:glow-effect-electric active:scale-95 transition-all rounded-lg flex items-center gap-2 border border-brand-cyan/20 w-full sm:w-auto justify-center"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Publicar pelo Pilot
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </motion.div>

          {/* Success toast popup */}
          <AnimatePresence>
            {showSuccessToast && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 p-4.5 rounded-xl border border-emerald-500/20 bg-emerald-950/90 backdrop-blur shadow-2xl flex items-start gap-3.5 max-w-sm glow-effect-cyan"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-white uppercase tracking-wide">Post Publicado com Sucesso!</h4>
                  <p className="text-xs text-neutral-slate mt-1">O Pilot enviou de forma assíncrona essa copy para o seu canal {activeChannel} conectado.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* SEÇÃO "ONDE ATUAMOS" (Multi-channel & Feature Bento-Grid) */}
      <section id="onde-atuamos" className="relative py-20 bg-brand-deep/60">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan bg-brand-cyan/15 px-3.5 py-1 rounded-full pointer-events-none">
              Conexões Integradas
            </span>
            <h2 className="mt-4 text-3xl md:text-4.5xl font-extrabold text-neutral-white tracking-tight leading-[1.2]">
              Presença Editorial Multicanal. <br />
              No mesmo painel.
            </h2>
            <p className="mt-4 text-neutral-slate font-normal text-base md:text-lg max-w-xl mx-auto">
              Chega de abrir dezenas de abas. O Pilot centraliza as regras e APIs oficiais das maiores redes profissionais e técnicas para maximizar o seu alcance orgânico sem esforço.
            </p>
          </div>

          {/* Interactive UI card showcasing platform-specific adapters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left menu selection */}
            <div className="lg:col-span-4 space-y-3">
              {[
                { 
                  id: 'LinkedIn', 
                  title: 'LinkedIn Professional', 
                  description: 'Storytelling executivo focado em KPIs de autoridade empresarial.', 
                  icon: <Linkedin className="h-5 w-5 text-[#0A66C2]" /> 
                },
                { 
                  id: 'X / Twitter', 
                  title: 'X / Twitter Threads', 
                  description: 'Engajamento rápido com ganchos fortes e conversas em fio automatizadas.', 
                  icon: <Twitter className="h-5 w-5 text-sky-400" /> 
                },
                { 
                  id: 'Instagram', 
                  title: 'Instagram Creative', 
                  description: 'Legendas ricas, carrosséis estruturados e geração inteligente de call to actions.', 
                  icon: <Instagram className="h-5 w-5 text-pink-500" /> 
                },
                { 
                  id: 'Dev.to', 
                  title: 'Blog Técnico (Dev.to / Markdown)', 
                  description: 'Artigos ricos de tecnologia com blocos em código com formatação impecável.', 
                  icon: <Code className="h-5 w-5 text-emerald-400" /> 
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveOndeTab(tab.id as SocialChannel)}
                  className={`w-full text-left p-4.5 rounded-xl border transition-all flex items-start gap-4 ${
                    activeOndeTab === tab.id 
                      ? 'bg-slate-900 border-brand-cyan/40 glow-effect-cyan' 
                      : 'bg-brand-deep/30 border-brand-cyan/5 hover:border-brand-cyan/25'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-slate-950 mt-0.5">
                    {tab.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-white">{tab.title}</h3>
                    <p className="text-xs text-neutral-slate mt-1 leading-relaxed">{tab.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right mock rendering according to selected channel tab */}
            <div className="lg:col-span-8 p-1.5 rounded-2xl bg-slate-900/60 border border-brand-cyan/15 glow-effect-cyan relative">
              <div className="bg-slate-950 rounded-xl overflow-hidden min-h-[380px] flex flex-col justify-between">
                
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-brand-cyan/10 px-5 py-4.5 bg-brand-deep/40 text-xs text-neutral-slate/60">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-brand-cyan" />
                    <span>Visualização prévia do motor editorial</span>
                  </div>
                  <span className="font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                    ADAPTADO PARA {activeOndeTab.toUpperCase()}
                  </span>
                </div>

                {/* Simulated rendering block */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                  
                  {activeOndeTab === 'LinkedIn' && (
                    <div className="text-left max-w-xl mx-auto bg-slate-900 p-5 rounded-xl border border-brand-cyan/10">
                      <div className="flex items-center gap-3.5 mb-4.5">
                        <div className="w-10 h-10 rounded-full bg-brand-electric/30 flex items-center justify-center font-bold text-brand-cyan select-none">
                          P
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-white">Pilot Content SaaS <span className="text-[10px] text-neutral-slate/40 block font-normal">Automação de marca • 1º</span></h4>
                          <span className="text-[11px] text-neutral-slate/50">Agora mesmo • 🌐</span>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-neutral-offwhite leading-relaxed">
                        O Pilot Content formata histórias que estimulam a autoridade da sua marca.
                        <br /><br />
                        As primeiras linhas operam como um ímã de retenção. Integramos estruturas lógicas consagradas como AIDA (Atenção, Interesse, Desejo, Ação) para aumentar o CTR do seu blog corporativo organicamente.
                        <br /><br />
                        #SaaSInsights #MarketingDePerformance #GrowthHacking
                      </p>
                      <div className="mt-4.5 pt-3.5 border-t border-brand-cyan/15 flex items-center justify-between text-neutral-slate/45 text-xs">
                        <span>👍 154 curtidas</span>
                        <span>💬 47 comentários</span>
                      </div>
                    </div>
                  )}

                  {activeOndeTab === 'X / Twitter' && (
                    <div className="text-left max-w-xl mx-auto bg-slate-900 p-5 rounded-xl border border-brand-cyan/10">
                      <div className="flex items-center gap-3 mb-3.5">
                        <div className="w-9 h-9 rounded-full bg-neutral-white/10 flex items-center justify-center font-bold text-neutral-white">
                          P
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-white">Pilot Content <span className="text-xs text-neutral-slate/40 font-normal">@pilot_content</span></h4>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-neutral-offwhite leading-relaxed">
                        1/ O motor do Pilot sabe que a limitação de caracteres do Twitter exige máxima síntese verbal. 
                      </p>
                      <div className="h-[2px] w-full bg-brand-cyan/10 my-3.5" />
                      <p className="text-xs md:text-sm text-neutral-offwhite leading-relaxed">
                        2/ Por isso, estruturamos ganchos em formato de fios (threads) com dados, mantendo seu público vidrado do primeiro ao último tweet.
                      </p>
                      <div className="mt-4 flex gap-4 text-xs text-neutral-slate/40">
                        <span>💬 12</span>
                        <span>🔁 35</span>
                        <span>❤️ 512</span>
                      </div>
                    </div>
                  )}

                  {activeOndeTab === 'Instagram' && (
                    <div className="text-left max-w-xl mx-auto bg-slate-900 p-5 rounded-xl border border-brand-cyan/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-xs font-bold text-neutral-white">
                          P
                        </div>
                        <h4 className="text-sm font-extrabold text-neutral-white">pilot.content</h4>
                      </div>
                      <div className="aspect-video w-full rounded-lg bg-brand-deep/80 flex flex-col items-center justify-center border border-brand-cyan/20 p-4 text-center mb-4">
                        <Sparkles className="h-7 w-7 text-brand-cyan mb-2" />
                        <span className="text-xs font-bold text-neutral-white uppercase tracking-wider">Conteúdo Visual do Carrossel</span>
                        <span className="text-[10px] text-neutral-slate/60 mt-1">Gerado no tom: {activeTone}</span>
                      </div>
                      <p className="text-xs text-neutral-offwhite leading-relaxed">
                        <strong>pilot.content</strong> 🧠 Legendas otimizadas com espaçamentos estrategicamente mapeados e emojis elegantes para guiar o olhar até a sua chamada de ação na bio.
                      </p>
                    </div>
                  )}

                  {activeOndeTab === 'Dev.to' && (
                    <div className="text-left max-w-xl mx-auto bg-slate-900 p-5 rounded-xl border border-brand-cyan/10 font-mono text-xs max-h-[280px] overflow-y-auto">
                      <span className="text-[#06B6D4]"># O poder de artigos estruturados em Markdown</span>
                      <p className="text-neutral-offwhite mt-2 leading-relaxed">
                        O Pilot escreve posts completos para blogs de desenvolvimento, dev.to e Medium, gerando títulos, códigos perfeitamente coloridos e tabelas de dados explicativos.
                      </p>
                      <div className="bg-slate-950 p-2.5 rounded border border-brand-cyan/20 my-3 text-[#2563EB]">
                        {`export function PilotCore() {
  return <Sparkles name="escala" />
}`}
                      </div>
                      <p className="text-neutral-slate">
                        Ideal para engenheiros que dominam o código mas precisam de máxima vazão textual.
                      </p>
                    </div>
                  )}

                </div>

                {/* Footer specs */}
                <div className="px-5 py-4 border-t border-brand-cyan/10 bg-brand-deep/30 text-xs flex justify-between items-center">
                  <span className="text-neutral-slate/50">Layout 100% responsivo para mobile</span>
                  <a href="#fale-conosco" className="text-brand-cyan hover:underline inline-flex items-center gap-1">
                    Conectar minhas contas <ArrowRight className="h-3 w-3" />
                  </a>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SEÇÃO DE EXPLICAÇÃO O QUE SERIA O PILOT (Workflow / How It Works) */}
      <section id="o-que-e" className="relative py-20 bg-grid-lines">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#06B6D4] bg-[#06B6D4]/15 px-3.5 py-1 rounded-full pointer-events-none">
              Arquitetura de Operação
            </span>
            <h2 className="mt-4 text-3xl md:text-4.5xl font-extrabold text-neutral-white tracking-tight leading-[1.2]">
              Do rascunho de cabeceira até a <br />
              publicidade distribuída. Em 4 passos.
            </h2>
            <p className="mt-4 text-neutral-slate max-w-lg mx-auto text-base">
              O motor editorial que se acopla ao seu workflow de marca atual, criando e executando cronogramas com zero atrito humano. Por isso somos a marca preferida das agências.
            </p>
          </div>

          {/* Connected Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative items-start">
            
            {[
              {
                num: '01',
                title: 'Entrada Criativa',
                desc: 'Insira um insight minimalista ou áudio informal. O Pilot decodifica as ideias centrais e vetores conceituais.',
                glow: 'from-brand-cyan/20 to-transparent'
              },
              {
                num: '02',
                title: 'Curadoria de Tom',
                desc: 'Defina as fronteiras morais da sua empresa, tom de voz, persona de marca e palavras-chave obrigatórias.',
                glow: 'from-brand-electric/20 to-transparent'
              },
              {
                num: '03',
                title: 'Otimização Editorial',
                desc: 'O Pilot modela as copies, hashtags e links de forma única para cada destino baseado em regras de performance.',
                glow: 'from-brand-cyan/20 to-transparent'
              },
              {
                num: '04',
                title: 'Agendamento & Post',
                desc: 'Dispare pelas nossas conexões integradas instantaneamente ou agende para maximizar seu tráfego nos melhores horários.',
                glow: 'from-brand-electric/20 to-transparent'
              }
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative bg-slate-900/30 border border-brand-cyan/10 rounded-2xl p-6 hover:border-brand-cyan/30 hover:glow-effect-cyan transition-all group overflow-hidden"
              >
                
                {/* Decorative glow bg element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-cyan/5 to-transparent pointer-events-none rounded-bl-full" />
                
                <div className="font-mono text-3xl font-extrabold text-brand-cyan select-none tracking-wider group-hover:scale-105 transition-transform duration-300">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-neutral-white mt-4.5 mb-2 group-hover:text-brand-cyan transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  {step.desc}
                </p>

              </motion.div>
            ))}

          </div>

          {/* Core Workflow diagram or graphic placeholder to emulate the floating icon in the design */}
          <div className="mt-16 flex justify-center">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="relative p-6 px-10 rounded-2xl bg-brand-deep/80 border border-brand-cyan/15 glow-effect-cyan flex flex-col md:flex-row items-center gap-6 max-w-2xl text-center md:text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/30 text-brand-cyan shrink-0">
                <Cpu className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-white">Estatísticas Operacionais Seguras</h4>
                <p className="text-xs text-neutral-slate mt-1">Conexões autenticadas via JWT criptografados e chaves locais persistidas em bancos isolados. Nenhuma rede sua expõe seus acessos a terceiros externos.</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* SEÇÃO DE QUEM SOMOS (Creator & Philosophy Team Background) */}
      <section id="quem-somos" className="relative py-20 bg-brand-deep/40 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[40rem] ambient-bottom-gradient pointer-events-none z-0" />
        
        <div className="relative mx-auto max-w-7xl px-6 md:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual block to resemble developer illustration in the design */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative rounded-2xl border border-brand-cyan/15 bg-slate-900/60 p-6 md:p-8 overflow-hidden glow-effect-cyan glow-effect-border"
              >
                
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-5 w-5 text-brand-cyan" />
                  <span className="text-xs font-bold text-neutral-white uppercase tracking-wider">Por Trás do Algoritmo</span>
                </div>

                <div className="space-y-4">
                  
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-brand-cyan/5">
                    <span className="text-xs text-brand-cyan font-mono block mb-1">Nosso Propósito //</span>
                    <p className="text-xs text-neutral-offwhite leading-relaxed">
                      "Criamos o Pilot com a filosofia de que conteúdo rico requer profunda inteligência e excelente layout, mas que o processo puramente mecânico de agendar e transcrever canais não deve sugar a criatividade dos profissionais."
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-brand-cyan/5">
                    <span className="text-xs text-brand-cyan font-mono block mb-1">Engenharia de Elite //</span>
                    <p className="text-xs text-neutral-offwhite leading-relaxed">
                      Nosso time de fundadores é composto por ex-engenheiros de Growth de Big Techs e copywriters obcecados por dados. Desenvolvemos o sistema para ser leve, rápido e integrado a modelos de linguagem topo de mercado de forma proprietária.
                    </p>
                  </div>

                </div>

                <div className="mt-8 flex items-center justify-between border-t border-brand-cyan/10 pt-4 text-xs font-mono text-neutral-slate/40">
                  <span>Sede: Florianópolis - SC</span>
                  <span>Fundado em 2026</span>
                </div>

              </motion.div>
            </div>

            {/* Content text */}
            <div className="lg:col-span-7 lg:pl-6 order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#06B6D4] bg-[#06B6D4]/11 px-3.5 py-1 rounded-full">
                Quem Somos nós
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-extrabold text-neutral-white tracking-tight leading-[1.1] mb-6">
                Unindo código impecável <br />
                com narrativa de impacto.
              </h2>
              <p className="text-neutral-slate leading-relaxed text-base md:text-lg mb-6 text-justify">
                Nós da equipe **Pilot** entendemos que a presença digital de uma startup ou criador hoje define suas taxas de conversão de funil de vendas. No entanto, produzir posts regulares de altíssimo nível técnico se tornou um fardo de 12 horas diárias.
              </p>
              <p className="text-neutral-slate leading-relaxed text-sm md:text-base text-justify">
                Nosso produto foi rascunhado para liberar sua mente e triplicar a sua capacidade editorial de modo autônomo. Mapeamos as tendências das redes de forma dinâmica, garantindo que suas comunicações expressem a originalidade do tom verbal da sua marca sem complexidades técnicas.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-brand-cyan">+3.5M</h4>
                  <p className="text-xs text-neutral-slate mt-1.5 uppercase font-bold tracking-wide">Posts Distribuídos</p>
                </div>
                <div>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-brand-cyan">99.8%</h4>
                  <p className="text-xs text-neutral-slate mt-1.5 uppercase font-bold tracking-wide">Tempo de Atividade da API</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO PARA O PÚBLICO INTEGRAL QUE O PILOT ATENDE (Target Audiences) */}
      <section id="publico" className="relative py-20 bg-brand-deep">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan bg-brand-cyan/15 px-3 py-1 rounded-full pointer-events-none">
              Nossos Usuários
            </span>
            <h2 className="mt-4 text-3xl md:text-4.5xl font-extrabold text-neutral-white tracking-tight leading-[1.2]">
              Desenhado para quem busca <br />
              máxima eficiência editorial.
            </h2>
            <p className="mt-4 text-neutral-slate font-normal text-sm md:text-base max-w-lg mx-auto">
              Cada perfil possui necessidades e volumes únicos de publicação. Selecionamos layouts integrados customizados para acelerar seu pipeline de canais.
            </p>
          </div>

          {/* Interactive Audience Tabs and Card Displays */}
          <div className="flex justify-center gap-3 mb-10 overflow-x-auto pb-2 shrink-0">
            {[
              { id: 'startups', name: 'SaaS & Startups' },
              { id: 'agencies', name: 'Agências de Marketing' },
              { id: 'creators', name: 'Criadores & Solopreneurs' }
            ].map((audience) => (
              <button
                key={audience.id}
                onClick={() => setSelectedAudience(audience.id as any)}
                className={`px-5 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  selectedAudience === audience.id 
                    ? 'bg-brand-electric text-neutral-white border border-brand-cyan/20 shadow-lg shadow-brand-electric/15 glow-effect-electric' 
                    : 'bg-slate-900 border border-brand-cyan/5 text-neutral-slate hover:text-neutral-white'
                }`}
              >
                {audience.name}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {selectedAudience === 'startups' && (
                <motion.div
                  key="startups"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-slate-900/55 p-6 md:p-10 rounded-2xl border border-brand-cyan/15 glow-effect-cyan relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-brand-electric/10 to-transparent pointer-events-none rounded-bl-full" />
                  
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="space-y-4 max-w-lg">
                      <div className="inline-flex items-center gap-2 text-brand-cyan text-xs font-mono tracking-wider uppercase bg-brand-cyan/10 px-2.5 py-1 rounded">
                        <Activity className="h-4 w-4" />
                        Inovação Automatizada
                      </div>
                      <h3 className="text-xl md:text-2.5xl font-extrabold text-neutral-white">
                        Posicione seu SaaS como líder de opinião enquanto foca no core-product.
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-slate leading-relaxed">
                        Fundadores e gerentes de produto usam o Pilot para extrair changelogs, documentações técnicas ou releases e transpilar em posts elegantes para LinkedIn e Threads em menos de 1 minuto, garantindo aquisição de leads qualificados.
                      </p>
                      <ul className="space-y-2 text-xs md:text-sm font-semibold text-neutral-offwhite">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Otimização de SEO para autoridade intelectual
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Distribuidor de releases automatizado por triggers
                        </li>
                      </ul>
                    </div>
                    
                    <div className="w-full md:w-80 space-y-3 shrink-0 bg-slate-950 p-5 rounded-xl border border-brand-cyan/5 text-xs font-mono">
                      <span className="text-neutral-slate/40 text-[10px] uppercase">Mapeamento de KPIs Hubspot</span>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-brand-cyan/5 pb-1">
                          <span>Tráfego Orgânico</span>
                          <span className="text-emerald-400 font-bold">+284%</span>
                        </div>
                        <div className="flex justify-between border-b border-brand-cyan/5 pb-1">
                          <span>Custo de Aquisição (CAC)</span>
                          <span className="text-emerald-400 font-bold">-45%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo por Redator</span>
                          <span className="text-emerald-400 font-bold">-14h/semana</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {selectedAudience === 'agencies' && (
                <motion.div
                  key="agencies"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-slate-900/55 p-6 md:p-10 rounded-2xl border border-brand-cyan/15 glow-effect-cyan relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-brand-cyan/10 to-transparent pointer-events-none rounded-bl-full" />
                  
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="space-y-4 max-w-lg">
                      <div className="inline-flex items-center gap-2 text-brand-cyan text-xs font-mono tracking-wider uppercase bg-brand-cyan/10 px-2.5 py-1 rounded">
                        <Layers className="h-4 w-4" />
                        Multi-tenant Escala
                      </div>
                      <h3 className="text-xl md:text-2.5xl font-extrabold text-neutral-white">
                        Multiplique a margem de lucro de sua agência gerenciando 30 clientes sem esgotamento.
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-slate leading-relaxed">
                        Agências de marketing usam o Pilot para configurar espaços de trabalho isolados para cada cliente, predefinir caminhos de aprovação, unificar faturamentos e produzir relatórios analíticos de engajamento em lotes.
                      </p>
                      <ul className="space-y-2 text-xs md:text-sm font-semibold text-neutral-offwhite">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Espaço com tom de voz individual por marca
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Calendário de agendamento em grade com aprovação
                        </li>
                      </ul>
                    </div>
                    
                    <div className="w-full md:w-80 space-y-3 shrink-0 bg-slate-950 p-5 rounded-xl border border-brand-cyan/5 text-xs font-mono">
                      <span className="text-neutral-slate/40 text-[10px] uppercase">Gargalo de Produção Resolvido</span>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-brand-cyan/5 pb-1">
                          <span>Nº Contas Atendidas/Gestor</span>
                          <span className="text-[#06B6D4] font-bold">de 3 para 20</span>
                        </div>
                        <div className="flex justify-between border-b border-brand-cyan/5 pb-1">
                          <span>Faturamento médio</span>
                          <span className="text-emerald-400 font-bold">+180%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Aclamação Clientes</span>
                          <span className="text-emerald-400 font-bold">Excelente</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {selectedAudience === 'creators' && (
                <motion.div
                  key="creators"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-slate-900/55 p-6 md:p-10 rounded-2xl border border-brand-cyan/15 glow-effect-cyan relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#2563EB]/10 to-transparent pointer-events-none rounded-bl-full" />
                  
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="space-y-4 max-w-lg">
                      <div className="inline-flex items-center gap-2 text-brand-cyan text-xs font-mono tracking-wider uppercase bg-brand-cyan/10 px-2.5 py-1 rounded">
                        <Globe className="h-4 w-4" />
                        Tráfego Solo Orgânico
                      </div>
                      <h3 className="text-xl md:text-2.5xl font-extrabold text-neutral-white">
                        Seja um criador multicanal com a velocidade de 5 pessoas.
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-slate leading-relaxed">
                        Creators, consultores independentes e solopreneurs utilizam o Pilot para capturar ideias do dia-a-dia rapidamente via celular, permitindo que a IA monte as stories, posts técnicos de portfólio de engenharia e os coloque na fila de postagens.
                      </p>
                      <ul className="space-y-2 text-xs md:text-sm font-semibold text-neutral-offwhite">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Operação direta por app mobile / chat
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Auto-hasgthaging focado no algoritmo atual do X/Y
                        </li>
                      </ul>
                    </div>
                    
                    <div className="w-full md:w-80 space-y-3 shrink-0 bg-slate-950 p-5 rounded-xl border border-brand-cyan/5 text-xs font-mono">
                      <span className="text-neutral-slate/40 text-[10px] uppercase">Retorno sobre Tempo Dedicado</span>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-brand-cyan/5 pb-1">
                          <span>Presença de canais</span>
                          <span className="text-[#06B6D4] font-bold">LinkedIn + X + Insta</span>
                        </div>
                        <div className="flex justify-between border-b border-brand-cyan/5 pb-1">
                          <span>Impressões orgânicas</span>
                          <span className="text-emerald-400 font-bold">+410%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dedicação mensal</span>
                          <span className="text-emerald-400 font-bold">2.5 horas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* SEÇÃO CONTACT / AGENDAR CONSULTA / FALE CONOSCO */}
      <section id="fale-conosco" className="relative py-20 bg-grid-dots border-t border-brand-cyan/10">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          
          <div className="mx-auto max-w-3xl text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#06B6D4] bg-[#06B6D4]/13 px-3.5 py-1 rounded-full">
              Escalabilidade Imediata
            </span>
            <h2 className="mt-4 text-3xl md:text-4.5xl font-extrabold text-neutral-white tracking-tight">
              Inicie a automação da sua marca hoje
            </h2>
            <p className="mt-3 text-neutral-slate text-sm md:text-base max-w-md mx-auto">
              Seja para tirar dúvidas de integração ou agendar uma consultoria exclusiva com nosso time engenharia de fluxos para seu SaaS corporativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            
            {/* Info cards */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-brand-cyan/10 hover:border-brand-cyan/35 transition-all">
                <h4 className="text-base font-bold text-neutral-white flex items-center gap-2.5">
                  <span className="p-2 rounded bg-brand-cyan/10 text-brand-cyan"><Zap className="h-4.5 w-4.5" /></span>
                  Avaliação Sem Cartão de Crédito
                </h4>
                <p className="text-xs text-neutral-slate mt-2 leading-relaxed">
                  Ganhe 15 créditos promocionais de uso por mês vitalícios para gerar seus posts e validar as integrações de threads com o Hubspot e Twitter sem custos ocultos.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-brand-cyan/10 hover:border-brand-cyan/35 transition-all">
                <h4 className="text-base font-bold text-neutral-white flex items-center gap-2.5">
                  <span className="p-2 rounded bg-brand-electric/10 text-brand-cyan"><Settings className="h-4.5 w-4.5 animate-spin" style={{ animationDuration: '6s' }} /></span>
                  Migração Gratuita de Cronograma
                </h4>
                <p className="text-xs text-neutral-slate mt-2 leading-relaxed">
                  Migramos seus rascunhos consolidados ou arquivos em Excel de marcas antigas de graça para nosso formato no piloto automático.
                </p>
              </div>

              <div className="flex items-center gap-4.5 border-t border-brand-cyan/10 pt-6">
                <div className="flex -space-x-2.5">
                  <span className="w-9.5 h-9.5 rounded-full border border-brand-cyan/30 bg-rose-950 flex items-center justify-center text-[10px] text-neutral-white font-bold select-none">AM</span>
                  <span className="w-9.5 h-9.5 rounded-full border border-brand-cyan/30 bg-emerald-950 flex items-center justify-center text-[10px] text-neutral-white font-bold select-none">JD</span>
                  <span className="w-9.5 h-9.5 rounded-full border border-brand-cyan/30 bg-[#2563EB] flex items-center justify-center text-[10px] text-neutral-white font-bold select-none">PL</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-white block">Atendimento por Engenheiros Ativos</span>
                  <span className="text-[11px] text-[#06B6D4]">Tempo de resposta médio: 14 minutos</span>
                </div>
              </div>
            </div>

            {/* Custom Interactive Booking Form Card */}
            <div className="p-1.5 rounded-2xl bg-slate-900/50 border border-brand-cyan/15 glow-effect-cyan">
              <div className="bg-slate-950 rounded-xl p-6 md:p-8">
                
                {formSubmitted ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/30">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-white">Demonstração Solicitada!</h3>
                    <p className="text-xs text-neutral-slate leading-relaxed max-w-sm mx-auto">
                      Olá <strong>{name}</strong>, enviamos um convite com links de agendamento de calendário para <strong>{email}</strong>. Vamos decolar sua marca juntos!
                    </p>
                    <button 
                      onClick={() => {
                        setFormSubmitted(false);
                        setEmail('');
                        setName('');
                      }} 
                      className="text-xs text-brand-cyan hover:underline mt-4 cursor-pointer"
                    >
                      Enviar outro email
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (name.trim() && email.trim()) {
                      setFormSubmitted(true);
                    }
                  }} className="space-y-4">
                    
                    <div>
                      <label className="block text-xs font-bold text-neutral-white uppercase tracking-wider mb-1.5">Seu Nome</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Pablo Santos"
                        className="w-full text-xs rounded-lg border border-brand-cyan/15 bg-slate-900 px-4 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-white uppercase tracking-wider mb-1.5">Email Profissional</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: pablo@agencia7zion.com.br"
                        className="w-full text-xs rounded-lg border border-brand-cyan/15 bg-slate-900 px-4 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-white uppercase tracking-wider mb-1.5">Assunto Doutrinário</label>
                      <select 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full text-xs rounded-lg border border-brand-cyan/15 bg-slate-900 px-4 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                      >
                        <option value="demonstracao">Agendar Chamada de Demonstração</option>
                        <option value="custom">Quero Integração Customizada</option>
                        <option value="ajuda">Dúvidas Técnicas / Chave API</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 mt-2 bg-brand-electric hover:bg-brand-electric/90 text-neutral-white hover:glow-effect-electric active:scale-[0.98] font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-brand-cyan/20 cursor-pointer"
                    >
                      Reservar Minha Demonstração
                    </button>

                    <div className="flex justify-center text-[10px] text-neutral-slate/40 text-center mt-2.5">
                      <span>Ao enviar você aceita os termos e agendamento automático de consultoria.</span>
                    </div>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CTA FOOTER BANNER (Build what is next together) */}
      <section className="relative py-12 md:py-20 bg-slate-950/80 overflow-hidden text-center border-t border-brand-cyan/10">
        <div className="mx-auto max-w-5xl px-6 md:px-8 relative z-10">
          
          <h2 className="text-3xl md:text-5xl font-extrabold text-neutral-white tracking-tight">
            Crie conteúdo impecável. Juntos.
          </h2>
          <p className="mt-4 text-xs md:text-sm text-neutral-slate max-w-lg mx-auto leading-relaxed">
            Experimente o SaaS Pilot Content hoje mesmo e automatize os rascunhos de postagens da sua marca ou agência. Alta performance, menor latência, escrita de mestre pelo seu Co-piloto.
          </p>

          <div className="mt-8.5 flex justify-center gap-4">
            <a 
              href="#sandbox" 
              className="px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-neutral-white bg-brand-electric hover:bg-brand-electric/90 rounded-xl border border-brand-cyan/25 glow-effect-electric transition-all shadow-lg"
            >
              Começar Agora de Graça
            </a>
            <a 
              href="#fale-conosco" 
              className="px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-neutral-white hover:bg-brand-cyan/5 rounded-xl border border-brand-cyan/25 transition-all"
            >
              Falar com Vendas
            </a>
          </div>

        </div>
      </section>

      {/* SITEMAP FOOTER */}
      <footer className="bg-brand-deep border-t border-brand-cyan/10 py-12 text-xs text-neutral-slate/70">
        <div className="mx-auto max-w-7xl px-6 md:px-8 grid grid-cols-2 md:grid-cols-12 gap-8 mb-10">
          
          <div className="col-span-2 md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-brand-electric text-neutral-white"><Rocket className="h-3.5 w-3.5" /></span>
              <span className="font-extrabold text-neutral-white tracking-wider text-sm select-none">PILOT CONTENT</span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs text-neutral-slate/60">
              O piloto automático completo para concepção de ideias, otimização gramatical localizada e agendamento inteligente em canais digitais ricos.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded bg-slate-900 border border-brand-cyan/10 text-neutral-slate hover:text-brand-cyan hover:border-brand-cyan/30 transition-all"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="p-2 rounded bg-slate-900 border border-brand-cyan/10 text-neutral-slate hover:text-brand-cyan hover:border-brand-cyan/30 transition-all"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="p-2 rounded bg-slate-900 border border-brand-cyan/10 text-neutral-slate hover:text-brand-cyan hover:border-brand-cyan/30 transition-all"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3.5">
            <span className="font-bold text-neutral-white block uppercase tracking-widest text-[10px]">Produto</span>
            <ul className="space-y-2">
              <li><a href="#sandbox" className="hover:text-brand-cyan transition-colors">Sandbox Demo</a></li>
              <li><a href="#onde-atuamos" className="hover:text-brand-cyan transition-colors">Adaptação de Canais</a></li>
              <li><a href="#o-que-e" className="hover:text-brand-cyan transition-colors">Fluxo Autônomo</a></li>
              <li><a href="#fale-conosco" className="hover:text-brand-cyan transition-colors">Preços / Planos</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3.5">
            <span className="font-bold text-neutral-white block uppercase tracking-widest text-[10px]">Empresa</span>
            <ul className="space-y-2">
              <li><a href="#quem-somos" className="hover:text-brand-cyan transition-colors">Quem Somos</a></li>
              <li><a href="#quem-somos" className="hover:text-brand-cyan transition-colors">Nossa Filosofia</a></li>
              <li><a href="#fale-conosco" className="hover:text-brand-cyan transition-colors">Suporte 24h</a></li>
              <li><a href="#" className="hover:text-brand-cyan transition-colors">Vagas / Carreiras</a></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3.5">
            <span className="font-bold text-neutral-white block uppercase tracking-widest text-[10px]">Recursos do Editor</span>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-brand-cyan transition-colors">Documentação do Integrador Pilot</a></li>
              <li><a href="#" className="hover:text-brand-cyan transition-colors">Modelos de Linguagem Customizados</a></li>
              <li><a href="#" className="hover:text-brand-cyan transition-colors">Status do Servidor Criptográfico</a></li>
              <li><a href="#" className="hover:text-brand-cyan transition-colors">Guia de Storytelling Executivo</a></li>
            </ul>
          </div>

        </div>

        <div className="mx-auto max-w-7xl px-6 md:px-8 border-t border-brand-cyan/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-neutral-slate/40">
          <span>&copy; 2026 Pilot Content, Inc. Todos os direitos reservados.</span>
          <div className="flex gap-4.5">
            <a href="#" className="hover:text-brand-cyan transition-colors">Privacidade</a>
            <a href="#" className="hover:text-brand-cyan transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-brand-cyan transition-colors">Segurança</a>
          </div>
        </div>

      </footer>

    </div>
  );
}
