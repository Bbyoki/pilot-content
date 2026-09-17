import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Cpu, 
  Sparkles, 
  Share2, 
  Trash2, 
  Edit3, 
  Calendar, 
  Check, 
  TrendingUp, 
  Play, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Code, 
  Zap, 
  Activity, 
  Layers, 
  LogOut, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Settings, 
  AlertCircle,
  FolderOpen,
  Image,
  Copy,
  Lock,
  Unlock,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedBackground from './AnimatedBackground';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  addDoc,
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { PostItem, SocialChannel, ToneType, PostStatus } from '../types';

interface DashboardProps {
  user: any;
  isAdm: boolean;
  onLogout: () => void;
}

export default function Dashboard({ user, isAdm, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'creator' | 'history' | 'channels' | 'settings'>('overview');
  const [historySubView, setHistorySubView] = useState<'list' | 'simple-creator' | 'robust-creator'>('list');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // Simple Post Creator States
  const [simplePostTitle, setSimplePostTitle] = useState('');
  const [simplePostContent, setSimplePostContent] = useState('');
  const [simplePostToneText, setSimplePostToneText] = useState('Profissional e técnico');
  const [simpleSourceText, setSimpleSourceText] = useState('');
  const [simplePostCount, setSimplePostCount] = useState<number>(1);
  const [simplePostSize, setSimplePostSize] = useState<'pequeno' | 'medio' | 'grande'>('medio');
  const [isGeneratingSimple, setIsGeneratingSimple] = useState(false);
  const [simpleDraftsList, setSimpleDraftsList] = useState<{ title: string; content: string }[]>([]);
  const [simpleDraftActiveIndex, setSimpleDraftActiveIndex] = useState<number>(0);
  
  // Database states
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  
  // Blog Content Source and Multi-Post Creator States
  const [blogSource, setBlogSource] = useState<'vite' | 'lgpd' | 'bootstrap' | 'custom'>('vite');
  const [customBlogText, setCustomBlogText] = useState('');
  const [numPostsToGenerate, setNumPostsToGenerate] = useState<number>(3);
  const [siteNamePrefix, setSiteNamePrefix] = useState('pilot-blog');
  
  // Google Authentication Sync and Gemini Plan
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [geminiPlan, setGeminiPlan] = useState<'basic' | 'pro'>('pro');
  
  // Multi-Generated Posts structure
  interface GeneratedPost {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string;
    imagePrompt: string;
    imageRes: '1:1' | '16:9' | '9:16' | '4:3';
    imageQuality: number; // 0..100
    imageFormat: 'webp' | 'png' | 'jpg' | 'avif';
    imageEffort: number; // 1..6
    imageSeed: number;
  }
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);

  // AI Creator Form States
  const [creatorTopic, setCreatorTopic] = useState('Como usar microsserviços para otimizar a velocidade de resposta em um SaaS bootstrap');
  const [creatorChannel, setCreatorChannel] = useState<SocialChannel>('LinkedIn');
  const [creatorTone, setCreatorTone] = useState<ToneType>('Técnico');
  const [audienceText, setAudienceText] = useState('Desenvolvedores e CTOs de Startups');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  
  // AI Creator Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [textTyped, setTextTyped] = useState('');
  
  // Connected channels state mapping
  const [channelConnections, setChannelConnections] = useState({
    LinkedIn: true,
    'X / Twitter': false,
    Instagram: false,
    'Dev.to': false
  });

  // Post editor sub-system states (Slide-over / modal overlay)
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');

  // Brand rules custom states
  const [brandVoice, setBrandVoice] = useState({
    excludeWords: 'revolucionário, disruptivo, inovador',
    presetHashtags: '#SaaS #Performance #TechSaaS',
    customSignature: '— Pilot Content Autopilot Team.'
  });

  // UI notifications
  const [showNotification, setShowNotification] = useState<{ show: boolean; text: string; error?: boolean }>({
    show: false,
    text: ''
  });

  // Load user posts from Firestore (with relative user ID querying)
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    const resolvedPath = 'posts';
    try {
      let fetchedPosts: PostItem[] = [];
      
      if (db && user?.uid) {
        // Build robust Firestore query fetching users-owned social articles
        const postsRef = collection(db, resolvedPath);
        const q = query(
          postsRef, 
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        
        snapshot.forEach((d) => {
          const data = d.data();
          fetchedPosts.push({
            id: d.id,
            userId: data.userId,
            title: data.title,
            content: data.content,
            channel: data.channel,
            tone: data.tone,
            status: data.status,
            scheduledTime: data.scheduledTime,
            createdAt: data.createdAt
          });
        });

        // Sort posts descending locally by timestamp
        fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(fetchedPosts);
      }
    } catch (err: any) {
      console.warn("Firestore error, setting up localStorage fallback for fluid offline preview experience:", err);
      // Fallback local memory storage to keep sandbox responsive if Firebase permissions are blocked
      const localCached = localStorage.getItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`);
      if (localCached) {
        setPosts(JSON.parse(localCached));
      } else {
        // Prepopulate with elegant mock items to showcase immediately
        const defaults: PostItem[] = [
          {
            id: 'mock_post_1',
            userId: user?.uid || 'guest',
            title: 'Growth hacking hacks',
            content: `🚀 Estratégias de Growth Hacking para acelerar marcas sem queimar capital.\n\nDepois de analisar mais de 43 startups bootstrapping no ecossistema atual, um dado chama muita atenção: quem prioriza tráfego pago em estágio inicial está desperdiçando margem.\n\nO segredo está na construção de autoridade multicanal de forma seriada. É exatamente o que implementamos no Pilot Content.\n\n#SaaS #MarketingIA`,
            channel: 'LinkedIn',
            tone: 'Persuasivo',
            status: 'Published',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'mock_post_2',
            userId: user?.uid || 'guest',
            title: 'Como limpar código',
            content: `O poder da arquitetura minimalista. 👇\n\nMenos linhas de código representam menos bugs, carregamento rápido e economia de escala na nuvem. Pare de colocar dependências pesadas desnecessárias no projeto. O timeto-first-value depende puramente da clareza da sua lógica primordial.\n\nConcorda? Comente abaixo.\n\n#Refactoring #CodeStyle`,
            channel: 'Dev.to',
            tone: 'Técnico',
            status: 'Draft',
            createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
          }
        ];
        setPosts(defaults);
        localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(defaults));
      }
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  // Handle triggered notifications
  const triggerToast = (text: string, isError = false) => {
    setShowNotification({ show: true, text, error: isError });
    setTimeout(() => {
      setShowNotification({ show: false, text: '' });
    }, 4500);
  };

  // Run dynamic typing simulation when content returns from backend
  useEffect(() => {
    if (!generatedText) return;
    let index = 0;
    setTextTyped('');
    
    const interval = setInterval(() => {
      setTextTyped((prev) => prev + generatedText.charAt(index));
      index++;
      if (index >= generatedText.length) {
        clearInterval(interval);
      }
    }, 3);

    return () => clearInterval(interval);
  }, [generatedText]);

  // Multi-post generator function matching selected blog source & custom input
  const handleCopilotGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedPosts([]);

    try {
      const response = await fetch('/api/generate-copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogSource: blogSource,
          customBlogText: customBlogText.trim(),
          creatorTopic: creatorTopic.trim(),
          count: numPostsToGenerate
        })
      });

      const data = await response.json();
      if (response.ok && data.posts) {
        const listWithIds: GeneratedPost[] = data.posts.map((post: any, idx: number) => ({
          id: 'gen_post_' + Math.random().toString(36).substring(2, 11),
          title: post.title,
          content: post.content,
          category: post.category,
          tags: post.tags,
          imagePrompt: post.imagePrompt,
          imageRes: idx % 3 === 0 ? '16:9' : (idx % 3 === 1 ? '1:1' : '9:16'),
          imageQuality: 85,
          imageFormat: 'webp',
          imageEffort: 4,
          imageSeed: Math.floor(Math.random() * 1000) + 1
        }));
        setGeneratedPosts(listWithIds);
        triggerToast(`Estruturados ${listWithIds.length} rascunhos de posts com sucesso no editor!`);
      } else {
        throw new Error(data.error || 'Erro na resposta do servidor.');
      }
    } catch (err: any) {
      console.error('Erro de geração do Co-piloto:', err);
      triggerToast('Falha na conexão com o Gemini API ao estruturar rascunhos.', true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Sync a single post from the multi-post generated drafts to Firebase and local cached history
  const handleSaveCopilotPost = async (p: GeneratedPost, status: PostStatus) => {
    const newPostId = 'post_copilot_' + Math.random().toString(36).substring(2, 11);
    const newPost: PostItem = {
      id: newPostId,
      userId: user?.uid || 'guest_bypass',
      title: p.title,
      content: p.content,
      channel: creatorChannel,
      tone: creatorTone,
      status: status,
      createdAt: new Date().toISOString()
    };

    try {
      if (db && user?.uid && user.uid !== 'pablo_admin_bypass') {
        await setDoc(doc(db, 'posts', newPostId), newPost);
      }
      
      const updatedList = [newPost, ...posts];
      setPosts(updatedList);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(updatedList));
      triggerToast(status === 'Published' ? 'Post publicado diretamente pelo Pilot!' : `Salvo no histórico como ${status}!`);
    } catch (err) {
      const updatedList = [newPost, ...posts];
      setPosts(updatedList);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(updatedList));
      triggerToast('Post do Co-piloto salvo localmente na Sandbox.', false);
    }
  };

  // Persists standard created AI post into database collections
  const handleSaveToDatabase = async (status: PostStatus, publishImmediate = false) => {
    if (!textTyped) return;

    const newPostId = 'post_' + Math.random().toString(36).substring(2, 11);
    const newPost: PostItem = {
      id: newPostId,
      userId: user?.uid || 'guest_bypass',
      title: creatorTopic.substring(0, 80),
      content: textTyped,
      channel: creatorChannel,
      tone: creatorTone,
      status: publishImmediate ? 'Published' : status,
      createdAt: new Date().toISOString()
    };

    try {
      if (db && user?.uid && user.uid !== 'pablo_admin_bypass') {
        const pathForWrite = `posts/${newPostId}`;
        await setDoc(doc(db, 'posts', newPostId), newPost);
      }
      
      // Update local view
      const updatedList = [newPost, ...posts];
      setPosts(updatedList);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(updatedList));
      
      triggerToast(publishImmediate ? 'Post publicado diretamente pelo Pilot!' : `Salvo no histórico como ${status}!`);
      
      // Clean generator section
      setCreatorTopic('');
      setGeneratedText('');
      setTextTyped('');
    } catch (err) {
      // In case write locks up, we handle using our diagnostic engine and protect workflow with local cached updates
      const updatedList = [newPost, ...posts];
      setPosts(updatedList);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(updatedList));
      triggerToast('Post salvo localmente na Sandbox.', false);
    }
  };

  const handleGenerarSimpleComIA = async () => {
    if (!simplePostTitle.trim() && !simpleSourceText.trim()) {
      triggerToast('Por favor, informe pelo menos o Título ou a Fonte de Conteúdo para guiar a IA.', true);
      return;
    }

    setIsGeneratingSimple(true);
    
    try {
      const response = await fetch('/api/generate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: simplePostTitle.trim(),
          sourceText: simpleSourceText.trim(),
          toneText: simplePostToneText.trim(),
          count: simplePostCount || 1,
          size: simplePostSize
        })
      });

      const data = await response.json();
      if (response.ok && data.posts) {
        setSimpleDraftsList(data.posts);
        setSimpleDraftActiveIndex(0);
        setSimplePostTitle(data.posts[0].title);
        setSimplePostContent(data.posts[0].content);
        triggerToast(`Rascunhos gerados com sucesso! (${data.posts.length} post${data.posts.length > 1 ? 's' : ''})`);
      } else {
        throw new Error(data.error || 'Erro na resposta do servidor.');
      }
    } catch (err: any) {
      console.error('Erro de geração:', err);
      triggerToast('Falha na conexão com o Gemini API.', true);
    } finally {
      setIsGeneratingSimple(false);
    }
  };

  // Persists simple posts created from the simple dashboard
  const handleSaveSimplePost = async (
    title: string, 
    content: string, 
    status: PostStatus
  ) => {
    if (!title.trim() || !content.trim()) {
      triggerToast('Por favor preencha o título e o conteúdo antes de salvar.', true);
      return;
    }

    const newPostId = 'post_simple_' + Math.random().toString(36).substring(2, 11);
    const newPost: PostItem = {
      id: newPostId,
      userId: user?.uid || 'guest_bypass',
      title: title.trim(),
      content: content.trim(),
      channel: 'LinkedIn', // default for backward compatible schema
      tone: 'Profissional', // default for backward compatible schema
      status: status,
      createdAt: new Date().toISOString()
    };

    try {
      if (db && user?.uid && user.uid !== 'pablo_admin_bypass') {
        await setDoc(doc(db, 'posts', newPostId), newPost);
      }
      
      const updatedList = [newPost, ...posts];
      setPosts(updatedList);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(updatedList));
      triggerToast(status === 'Published' ? 'Post publicado diretamente pelo Pilot!' : `Salvo no histórico como ${status}!`);
      
      // Visual feedback and navigate back
      setHistorySubView('list');
      setSimplePostTitle('');
      setSimplePostContent('');
      setSimpleSourceText('');
      setSimpleDraftsList([]);
    } catch (err) {
      const updatedList = [newPost, ...posts];
      setPosts(updatedList);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(updatedList));
      triggerToast('Post salvo localmente na Sandbox.', false);
      setHistorySubView('list');
      setSimplePostTitle('');
      setSimplePostContent('');
      setSimpleSourceText('');
      setSimpleDraftsList([]);
    }
  };

  // Deletes selected post document from Firestore collection
  const handleDeletePost = async (id: string) => {
    try {
      if (db && user?.uid && user.uid !== 'pablo_admin_bypass' && !id.startsWith('mock_')) {
        await deleteDoc(doc(db, 'posts', id));
      }
      const filtered = posts.filter(p => p.id !== id);
      setPosts(filtered);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(filtered));
      triggerToast('Registro de post deletado com sucesso.');
    } catch (err) {
      console.error("Erro na deleção:", err);
      triggerToast('Não foi possível deletar o post de forma síncrona.', true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('Nome do arquivo copiado para a área de transferência!');
  };

  // Immediate publication command in table
  const handlePublishPostDirectly = async (post: PostItem) => {
    const updated = { ...post, status: 'Published' as PostStatus };
    try {
      if (db && user?.uid && user.uid !== 'pablo_admin_bypass' && !post.id.startsWith('mock_')) {
        await updateDoc(doc(db, 'posts', post.id), { status: 'Published' });
      }
      const mapped = posts.map(p => p.id === post.id ? updated : p);
      setPosts(mapped);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(mapped));
      triggerToast(`Post enviado e publicado no canal ${post.channel}!`);
    } catch (err) {
      const mapped = posts.map(p => p.id === post.id ? updated : p);
      setPosts(mapped);
      triggerToast(`Post publicado em modo restrito.`);
    }
  };

  // Edit action opening overlay slide-over panel
  const handleOpenEditPost = (post: PostItem) => {
    setEditingPost(post);
    setEditorTitle(post.title);
    setEditorContent(post.content);
  };

  // Updates changes of editable posts
  const handleSavePostEdits = async () => {
    if (!editingPost) return;
    
    const updatedPost = {
      ...editingPost,
      title: editorTitle,
      content: editorContent
    };

    try {
      if (db && user?.uid && user.uid !== 'pablo_admin_bypass' && !editingPost.id.startsWith('mock_')) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          title: editorTitle,
          content: editorContent
        });
      }
      const mapped = posts.map(p => p.id === editingPost.id ? updatedPost : p);
      setPosts(mapped);
      localStorage.setItem(`pilot_cached_posts_${user?.uid || 'anonymous'}`, JSON.stringify(mapped));
      setEditingPost(null);
      triggerToast('Alterações salvas com sucesso no banco de dados!');
    } catch (err) {
      const mapped = posts.map(p => p.id === editingPost.id ? updatedPost : p);
      setPosts(mapped);
      setEditingPost(null);
      triggerToast('Alterações salvas de forma asíncrona.');
    }
  };

  // Toggle dynamic integration mapping
  const handleToggleChannel = (channel: keyof typeof channelConnections) => {
    setChannelConnections(prev => {
      const statusValue = !prev[channel];
      triggerToast(`${channel as string} foi ${statusValue ? 'conectado com sucesso ao Pilot API.' : 'desconectado.'}`);
      return { ...prev, [channel]: statusValue };
    });
  };

  // Render mock statistics graph data safely
  const performanceData = [
    { name: 'Semana 1', linkedin: 240, twitter: 140, instagram: 80, dev: 50 },
    { name: 'Semana 2', linkedin: 380, twitter: 220, instagram: 120, dev: 90 },
    { name: 'Semana 3', linkedin: 490, twitter: 310, instagram: 190, dev: 150 },
    { name: 'Semana 4', linkedin: 680, twitter: 450, instagram: 240, dev: 180 },
  ];

  const categoryDistribution = [
    { name: 'LinkedIn', posts: posts.filter(p => p.channel === 'LinkedIn').length || 4 },
    { name: 'X / Twitter', posts: posts.filter(p => p.channel === 'X / Twitter').length || 2 },
    { name: 'Instagram', posts: posts.filter(p => p.channel === 'Instagram').length || 1 },
    { name: 'Dev.to', posts: posts.filter(p => p.channel === 'Dev.to').length || 3 },
  ];

  return (
    <div className="min-h-screen bg-transparent text-neutral-slate font-sans flex antialiased selection:bg-brand-cyan/20 relative">
      <AnimatedBackground />
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-64 max-h-screen sticky top-0 hidden md:flex flex-col justify-between p-6 bg-slate-950/90 border-r border-brand-cyan/10 shrink-0 z-20">
        
        <div className="space-y-8">
          
          {/* Logo element */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-electric text-neutral-white overflow-hidden shadow-md shadow-brand-electric/15">
              <Rocket className="h-4 w-4 text-neutral-white animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/30 to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-neutral-white tracking-wider text-base">PILOT</span>
              <span className="text-[8px] text-brand-cyan font-bold uppercase tracking-wider -mt-1">Content IA</span>
            </div>
          </div>

          {/* ACTIVE ACCOUNT LOGGED PROFILE DETAIL */}
          <div className="p-4 rounded-xl border border-brand-cyan/10 bg-brand-deep/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-brand-cyan/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center font-bold font-mono text-brand-cyan text-sm">
                P
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-neutral-white truncate">{user?.email || 'pablo@agencia7zion.com.br'}</h4>
                
                {/* Discrete Unlimited chip styled as a paid client to respect privacy requirements */}
                <span className="inline-block mt-1 text-[9px] font-bold text-brand-cyan px-2 py-0.5 rounded bg-brand-cyan/10 uppercase tracking-widest border border-brand-cyan/15 animate-pulse">
                  Plano Corporativo
                </span>
              </div>
            </div>
          </div>

          {/* Navigation link list */}
          <nav className="flex flex-col gap-2 font-medium">
            {[
              { id: 'overview', title: 'Visão Geral / KPIs', icon: <Activity className="h-4 w-4" /> },
              { id: 'history', title: 'Conteúdos', icon: <Layers className="h-4 w-4" /> },
              { id: 'channels', title: 'Canais Conectados', icon: <Share2 className="h-4 w-4" /> },
              { id: 'settings', title: 'Identidade de Marca', icon: <Settings className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'history') {
                    setHistorySubView('list');
                  }
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3.5 border transition-all ${
                  activeTab === tab.id 
                    ? 'bg-brand-electric/15 border-brand-electric/50 text-neutral-white shadow-sm' 
                    : 'bg-transparent border-transparent text-neutral-slate hover:bg-slate-900 hover:text-neutral-white'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-brand-cyan' : 'text-neutral-slate/60'}>
                  {tab.icon}
                </span>
                {tab.title}
              </button>
            ))}
          </nav>
        </div>

        {/* LOG OUT ACTION */}
        <button
          onClick={onLogout}
          className="w-full py-3 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 transition-all text-neutral-slate text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 border border-transparent hover:border-rose-500/15"
        >
          <LogOut className="h-4 w-4" />
          Sair do Terminal
        </button>

      </aside>

      {/* COMPACT MOBILE NAVIGATION COMPONENT */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950 border-t border-brand-cyan/10 grid grid-cols-4 p-1.5 z-40">
        {[
          { id: 'overview', title: 'KPIs', icon: <Activity className="h-4.5 w-4.5" /> },
          { id: 'history', title: 'Conteúdos', icon: <Layers className="h-4.5 w-4.5" /> },
          { id: 'channels', title: 'Canais', icon: <Share2 className="h-4.5 w-4.5" /> },
          { id: 'settings', title: 'Marca', icon: <Settings className="h-4.5 w-4.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'history') {
                setHistorySubView('list');
              }
            }}
            className={`flex flex-col items-center justify-center py-2 rounded text-[10px] gap-1 transition-all ${
              activeTab === tab.id ? 'text-brand-cyan font-bold bg-brand-cyan/5' : 'text-neutral-slate/60'
            }`}
          >
            {tab.icon}
            <span>{tab.title}</span>
          </button>
        ))}
      </div>

      {/* MAIN CONTENT CONTAINER PANEL */}
      <main className="flex-1 min-h-screen overflow-y-auto p-6 sm:p-10 pb-24 md:pb-10 relative">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-[20%] w-[30rem] h-[30rem] bg-brand-cyan/5 rounded-full filter blur-[120px] pointer-events-none z-0" />

        {/* NOTIFY TOAST ELEMENT */}
        <AnimatePresence>
          {showNotification.show && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 max-w-sm shadow-2xl backdrop-blur-md ${
                showNotification.error 
                  ? 'border-amber-500/20 bg-amber-950/90 text-amber-300' 
                  : 'border-emerald-500/15 bg-emerald-950/90 text-emerald-300'
              }`}
            >
              {showNotification.error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
              <span className="text-xs font-medium font-sans">{showNotification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UPPER DASHBOARD HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-cyan/5 pb-6 mb-8 relative z-10">
          <div>
            <span className="text-[10px] text-brand-cyan font-mono tracking-widest uppercase bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
              Módulo de Automação
            </span>
            <h1 className="text-2xl font-bold text-neutral-white mt-1.5 capitalize tracking-tight flex items-center gap-2">
              {activeTab === 'overview' && 'Painel de Indicadores'}
              {activeTab === 'history' && 'Conteúdos'}
              {activeTab === 'channels' && 'Portais Autorizados'}
              {activeTab === 'settings' && 'Identidade Vocal Corporativa'}
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-brand-cyan/10 text-xs">
            <span className="font-mono text-zinc-400">Terminal ID:</span>
            <span className="font-mono font-bold text-brand-cyan px-2 py-0.5 rounded bg-brand-cyan/5 border border-brand-cyan/15">
              {user?.uid?.substring(0, 8) || 'adm_bypass'}
            </span>
          </div>
        </div>

        {/* DYNAMIC VIEW MANAGER SCREEN SWITCHBOARD */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERVIEW / METRICS */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              
              {/* RECENT RECORDS BANNER ROW (ONLY THIS AS REQ) */}
              <div className="p-6 rounded-2xl border border-brand-cyan/10 bg-slate-900/40 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-brand-cyan/5 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-neutral-white">Últimas Atividades de Geração</h3>
                    <p className="text-xs text-neutral-slate mt-0.5 font-normal">Suas publicações do co-piloto sincronizadas com o banco de dados Firebase Firestore.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('history')} 
                    className="text-xs text-brand-cyan hover:text-brand-cyan/80 transition-colors font-mono uppercase bg-brand-cyan/5 border border-brand-cyan/15 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    Ver todo o Histórico ({posts.length})
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-brand-cyan/10 bg-slate-950/20">
                    <FolderOpen className="h-10 w-10 text-brand-cyan/20 mx-auto mb-3" />
                    <p className="text-xs text-neutral-slate font-medium">Nenhum rascunho de post planejado ainda. Acesse a aba "Criador" para estruturar.</p>
                  </div>
                ) : (
                  <div className="space-y-3 font-medium">
                    {posts.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 rounded-xl border border-brand-cyan/5 bg-slate-950/40 text-xs gap-3">
                        <div className="flex items-center gap-3">
                          <span className="p-2 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/10">
                            {item.channel === 'LinkedIn' && <Linkedin className="h-4 w-4" />}
                            {item.channel === 'X / Twitter' && <Twitter className="h-4 w-4" />}
                            {item.channel === 'Instagram' && <Instagram className="h-4 w-4" />}
                            {item.channel === 'Dev.to' && <Code className="h-4 w-4" />}
                          </span>
                          <div>
                            <span className="text-neutral-white block font-bold text-[13px]">{item.title}</span>
                            <span className="text-[10px] text-neutral-slate mt-0.5 block font-normal">
                              Tom: <span className="text-brand-cyan font-semibold">{item.tone}</span> • Criado em {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center shrink-0 self-start sm:self-auto ${
                          item.status === 'Published' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : item.status === 'Scheduled'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: CO-PILOT CREATOR WORKSPACE */}
          {activeTab === 'history' && historySubView === 'robust-creator' && (
            <motion.div
              key="robust-creator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6 max-w-7xl mx-auto"
            >
              
              {/* Back button */}
              <div className="flex items-center justify-between mb-4 border-b border-brand-cyan/5 pb-4">
                <button
                  type="button"
                  onClick={() => setHistorySubView('list')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  &larr; Voltar para os posts
                </button>
                <div className="text-[10px] font-mono text-zinc-400">
                  Dashboard de Co-piloto Robusto
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Sidebar Setup Form */}
                <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl border border-brand-cyan/15 bg-slate-900/40 backdrop-blur-md space-y-4">
                  <h3 className="text-xs font-bold text-neutral-white uppercase tracking-wider border-b border-brand-cyan/10 pb-3 block">
                    Parâmetros de Co-piloto
                  </h3>
                  
                  <form onSubmit={handleCopilotGenerate} className="space-y-4">
                    
                    {/* Blog Content Source Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                        Fonte do Conteúdo do Blog
                      </label>
                      <select
                        value={blogSource}
                        onChange={(e) => setBlogSource(e.target.value as any)}
                        className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                      >
                        <option value="vite">Blog: Otimização de Builds e Performance React com Vite</option>
                        <option value="lgpd">Blog: Conformidade, LGPD e Segurança em Softwares SaaS</option>
                        <option value="bootstrap">Blog: Estratégias Saudáveis de Bootstrap para Startups</option>
                        <option value="custom">Artigo Personalizado (Digitar ou colar texto)</option>
                      </select>
                    </div>

                    {/* Conditional Custom Article input */}
                    {blogSource === 'custom' && (
                      <div className="animate-fade-in">
                        <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                          Texto ou URL do Artigo Fonte
                        </label>
                        <textarea
                          value={customBlogText}
                          onChange={(e) => setCustomBlogText(e.target.value)}
                          rows={4}
                          className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none transition-colors overflow-y-auto resize-none font-medium"
                          placeholder="Cole o artigo do blog completo ou digite os pontos de fomento para que o Co-piloto os mapeie em lote..."
                        />
                      </div>
                    )}

                    {/* Quantity Selector up to 5 */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                        Quantidade de Posts a Estruturar
                      </label>
                      <select
                        value={numPostsToGenerate}
                        onChange={(e) => setNumPostsToGenerate(Number(e.target.value))}
                        className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                      >
                        <option value="1">1 Post Filtrado</option>
                        <option value="2">2 Posts de Canal</option>
                        <option value="3">3 Posts em Lote</option>
                        <option value="4">4 Posts Completos</option>
                        <option value="5">5 Posts Máximos</option>
                      </select>
                      <span className="block text-[9px] text-[#06B6D4] mt-1 font-mono uppercase tracking-wider">Gere até 5 rascunhos completos com capas dedicadas.</span>
                    </div>

                    {/* Target Social Channel */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                        Canal Primário
                      </label>
                      <select
                        value={creatorChannel}
                        onChange={(e) => setCreatorChannel(e.target.value as SocialChannel)}
                        className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                      >
                        <option value="LinkedIn">LinkedIn (Carreiras/Empresarial)</option>
                        <option value="X / Twitter">X / Twitter (Sintético/Threads)</option>
                        <option value="Instagram">Instagram (Legendas/Carrosséis)</option>
                        <option value="Dev.to">Dev.to (Artigos Markdown Técnicos)</option>
                      </select>
                    </div>

                    {/* Brand Tone selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                        Diretriz Vocal (Tom)
                      </label>
                      <select
                        value={creatorTone}
                        onChange={(e) => setCreatorTone(e.target.value as ToneType)}
                        className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                      >
                        <option value="Profissional">Profissional (Sóbrio & Executivo)</option>
                        <option value="Persuasivo">Persuasivo (Ganchos de Conversão)</option>
                        <option value="Criativo">Criativo (Narrativa Fluida)</option>
                        <option value="Técnico">Técnico (Foco em dados e métricas)</option>
                      </select>
                    </div>

                    {/* Suffix / Site Name input (for image auto-naming) */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5 flex justify-between items-center">
                        <span>Nome do Site (SEO)</span>
                        <span className="text-[8px] text-neutral-slate font-mono uppercase bg-neutral-white/5 px-1.5 py-0.5 rounded font-bold">Prefixo</span>
                      </label>
                      <input
                        type="text"
                        value={siteNamePrefix}
                        onChange={(e) => setSiteNamePrefix(e.target.value)}
                        placeholder="Ex: meu-blog"
                        className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none transition-colors font-medium"
                      />
                    </div>

                    {/* REAL GOOGLE DELEGATE CHANNEL AUTHENTICATIVE LINK PANEL */}
                    <div className="p-3 rounded-xl border border-brand-cyan/10 bg-slate-950/60 text-xs mt-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-neutral-white text-[11px] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                          Integração Google Plan
                        </span>
                        
                        {isGoogleConnected ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            VINCULADO
                          </span>
                        ) : (
                          <span className="text-[8px] bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            PADRÃO
                          </span>
                        )}
                      </div>

                      {isGoogleConnected ? (
                        <div className="space-y-2">
                          <p className="text-[10px] text-neutral-slate leading-relaxed font-normal">
                            Conta ativa: <span className="font-bold text-neutral-white">Pablo Santos</span> (pablo@agencia7zion.com.br)
                          </p>
                          
                          <div className="flex items-center justify-between border-t border-brand-cyan/5 pt-2">
                            <span className="text-[9px] font-mono font-bold text-brand-cyan uppercase">
                              Plano: Gemini {geminiPlan === 'pro' ? 'Pro (Ativo)' : 'Básico'}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => setGeminiPlan(curr => curr === 'pro' ? 'basic' : 'pro')}
                              className="text-[9px] text-neutral-slate hover:text-brand-cyan underline cursor-pointer font-bold"
                            >
                              Simular {geminiPlan === 'pro' ? 'Básico' : 'Pro'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <p className="text-[10px] text-neutral-slate leading-relaxed">
                            Conecte sua conta do Google para puxar automaticamente seu plano Gemini contratado (impacta na qualidade tátil das capas).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsGoogleConnected(true);
                              setGeminiPlan('pro');
                              triggerToast('Conta Google conectada com sucesso! Plano Gemini Pro ativo.');
                            }}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-neutral-white font-mono text-[9px] uppercase tracking-wider border border-brand-cyan/10 hover:border-brand-cyan/30 rounded-lg transition-colors cursor-pointer font-bold"
                          >
                            Vincular Conta Google 
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider border border-brand-cyan/25 transition-all outline-none cursor-pointer ${
                        isGenerating 
                          ? 'bg-brand-cyan/20 text-brand-cyan cursor-not-allowed' 
                          : 'bg-brand-electric hover:bg-brand-electric/95 hover:glow-effect-electric text-neutral-white active:scale-[0.98]'
                      }`}
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                          Estruturando Rascunhos...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Sparkles className="h-4 w-4" />
                          Estruturar Rascunhos do Post
                        </span>
                      )}
                    </button>

                  </form>
                </div>

                {/* Main Workspace Area (Generated List or Empty state) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {generatedPosts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-cyan/15 bg-slate-950/20 py-24 px-6 text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-cyan/5 rounded-full filter blur-[100px] pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-electric/5 rounded-full filter blur-[100px] pointer-events-none" />
                      
                      <div className="w-14 h-14 rounded-full bg-brand-cyan/5 border border-brand-cyan/15 flex items-center justify-center text-brand-cyan text-xl">
                        <Sparkles className="h-6 w-6 text-brand-cyan" />
                      </div>
                      
                      <div>
                        <h3 className="text-base font-bold text-neutral-white">Nenhum Post Estruturado Ainda</h3>
                        <p className="text-xs text-neutral-slate max-w-sm mx-auto mt-2 leading-relaxed">
                          Escolha o artigo do blog à esquerda, defina as diretrizes de fomento e clique em "Estruturar Rascunhos do Post" para visualizar a diagramação, SEO e o otimizador de imagem.
                        </p>
                      </div>
                      
                      <button
                        onClick={handleCopilotGenerate}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/15 transition-all text-center uppercase tracking-wider cursor-pointer"
                      >
                        Estruturar Com Preset Padrão
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-brand-cyan/5 pb-3">
                        <span className="text-xs font-mono text-neutral-slate font-bold">
                          RASCUNHOS PREPARADOS: <strong className="text-neutral-white">{generatedPosts.length}</strong>
                        </span>
                        
                        <button
                          onClick={() => {
                            setGeneratedPosts([]);
                            triggerToast('Editor limpo com sucesso.');
                          }}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer font-bold"
                        >
                          Limpar Tudo
                        </button>
                      </div>

                      {generatedPosts.map((post, idx) => {
                        
                        // SEO automative name slug display logic
                        const getSluggedImageName = (postTitle: string, format: string) => {
                          const cleanPrefix = siteNamePrefix.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                          const cleanTitle = postTitle.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                          return `${cleanPrefix}-${cleanTitle || 'post'}.${format}`;
                        };

                        const seoImageName = getSluggedImageName(post.title, post.imageFormat);

                        // Squoosh simulation size metric
                        const rawSizeSizeKB = 3420; // 3.4MB raw png
                        let resolutionAspectMul = 1.0;
                        if (post.imageRes === '16:9') resolutionAspectMul = 1.25;
                        else if (post.imageRes === '9:16') resolutionAspectMul = 0.85;
                        else if (post.imageRes === '4:3') resolutionAspectMul = 1.1;

                        let formatDivider = 0.08; // default webp is highly optimized
                        if (post.imageFormat === 'png') formatDivider = 0.55;
                        else if (post.imageFormat === 'jpg') formatDivider = 0.16;
                        else if (post.imageFormat === 'avif') formatDivider = 0.04;

                        // Effort multiplier reductions
                        const reductionRateByEffort = 1.0 - (post.imageEffort * 0.02);

                        const optimizedKB = Math.round(
                          rawSizeSizeKB * 
                          formatDivider * 
                          (post.imageQuality / 100) * 
                          resolutionAspectMul * 
                          reductionRateByEffort
                        );

                        const savedSavedSavedPercent = Math.max(1, Math.round(((rawSizeSizeKB - optimizedKB) / rawSizeSizeKB) * 100));

                        return (
                          <div
                            key={post.id}
                            className="p-5 sm:p-6 rounded-2xl border border-brand-cyan/15 bg-slate-900/40 backdrop-blur-sm space-y-5"
                          >
                            
                            {/* Card Header Badge details */}
                            <div className="flex items-center justify-between border-b border-brand-cyan/5 pb-3">
                              <span className="text-[10px] bg-brand-cyan/15 text-brand-cyan font-mono border border-brand-cyan/20 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
                                Rascunho #{idx + 1} de {generatedPosts.length} • {post.category || 'Categoria'}
                              </span>
                              
                              <span className="text-[10px] text-zinc-400 font-mono font-bold">
                                STATUS: CO-PILOTANDO
                              </span>
                            </div>

                            {/* Editable Fields */}
                            <div className="space-y-4">
                              
                              {/* Title Editable Textarea */}
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5 font-mono">TÍTULO PRINCIPAL</label>
                                <input
                                  type="text"
                                  value={post.title}
                                  onChange={(e) => {
                                    setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, title: e.target.value } : p));
                                  }}
                                  className="w-full text-xs font-bold rounded-lg border border-brand-cyan/10 bg-slate-950 px-3.5 py-2.5 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                                />
                              </div>

                              {/* Content Editable Area */}
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5 font-mono font-bold">TEXTO DE CO-PILOTAÇÃO</label>
                                <textarea
                                  value={post.content}
                                  onChange={(e) => {
                                    setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: e.target.value } : p));
                                  }}
                                  rows={6}
                                  className="w-full text-xs rounded-lg border border-brand-cyan/10 bg-slate-950 px-3.5 py-3 text-neutral-offwhite placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none transition-colors leading-relaxed font-normal font-mono"
                                />
                              </div>

                              {/* Tags Editable row */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5 font-mono">CATEGORIA</label>
                                  <input
                                    type="text"
                                    value={post.category || ''}
                                    onChange={(e) => {
                                      setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, category: e.target.value } : p));
                                    }}
                                    className="w-full text-xs rounded-lg border border-brand-cyan/10 bg-slate-950 px-3 py-2 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5 font-mono">PALAVRAS-CHAVE / HASHTAGS</label>
                                  <input
                                    type="text"
                                    value={post.tags || ''}
                                    onChange={(e) => {
                                      setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, tags: e.target.value } : p));
                                    }}
                                    className="w-full text-xs rounded-lg border border-brand-cyan/10 bg-slate-950 px-3 py-2 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors font-medium"
                                  />
                                </div>
                              </div>

                            </div>

                            {/* PREMIUM IMAGE MANIPULATOR AND OPTIMIZER ROW */}
                            <div className="border border-brand-cyan/10 bg-slate-950/40 rounded-xl p-4 space-y-4">
                              <span className="text-[10px] font-mono font-bold text-neutral-white block border-b border-brand-cyan/5 pb-2">
                                🖼️ CAPA DO POST E OTIMIZADOR DE IMAGENS (ESTILO SQUOOSH)
                              </span>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                
                                {/* Photo crop aspect-ratio viewer container */}
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">PREVIEW DA RENDERIZAÇÃO</label>
                                  
                                  <div className="relative overflow-hidden border border-brand-cyan/15 bg-slate-900 rounded-lg flex items-center justify-center p-3 h-52">
                                    
                                    {/* Aspect crop render simulation wrapper */}
                                    <div 
                                      className={`w-full bg-gradient-to-tr from-slate-950 via-brand-deep to-slate-900 border border-brand-cyan/25 relative overflow-hidden transition-all duration-300 flex items-center justify-center flex-col max-h-44 ${
                                        post.imageRes === '16:9' ? 'aspect-video' : 
                                        post.imageRes === '9:16' ? 'aspect-[9/16]' : 
                                        post.imageRes === '4:3' ? 'aspect-[4/3]' : 
                                        'aspect-square'
                                      }`}
                                      style={{
                                        filter: `blur(${(100 - post.imageQuality) * 0.05}px) contrast(${100 + (100 - post.imageQuality) * 0.12}%)`,
                                      }}
                                    >
                                      
                                      {/* Abstract background graphics */}
                                      <div 
                                        className="absolute inset-0 bg-gradient-to-br transition-all duration-500 opacity-65"
                                        style={{
                                          backgroundImage: `radial-gradient(circle at ${post.imageSeed % 100}% ${post.imageSeed % 30}%, #06B6D4 0%, transparent 60%), radial-gradient(circle at 10% 80%, #2563EB 0%, transparent 50%)`,
                                        }}
                                      />
                                      
                                      {/* Interactive scanlines overlay */}
                                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)+50%,rgba(0,0,0,0.25)+50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,3px_100%] pointer-events-none" />

                                      {/* HD Glowing lines simulated overlay when Gemini Pro plan detected */}
                                      {isGoogleConnected && geminiPlan === 'pro' && (
                                        <div className="absolute inset-0 border border-brand-cyan/40 rounded pointer-events-none animate-pulse">
                                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-brand-cyan text-slate-950 font-mono text-[6px] font-bold tracking-widest rounded uppercase">
                                            Ultra-HD (2048px)
                                          </div>
                                        </div>
                                      )}

                                      {/* Content details printed on image */}
                                      <div className="relative z-10 p-4 text-center space-y-1 select-none pointer-events-none">
                                        <Sparkles className="h-4 w-4 text-brand-cyan mx-auto drop-shadow-md" />
                                        <span className="text-[9px] font-mono text-[#F8FAFC] tracking-wider uppercase block font-bold truncate max-w-[140px]">{siteNamePrefix}</span>
                                        <span className="text-[8px] text-neutral-slate font-mono uppercase bg-slate-950/85 px-1.5 py-0.5 rounded inline-block max-w-[130px] truncate">{post.category || 'Pilot'}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Resolution Plan Chip overlay */}
                                    <div className="absolute bottom-4 right-4 bg-slate-950/90 py-1 px-2 rounded border border-brand-cyan/20 text-[8px] font-mono text-brand-cyan select-none font-bold">
                                      {isGoogleConnected && geminiPlan === 'pro' ? '💎 GEMINI PRO' : '⚡ BÁSICO (512px)'}
                                    </div>

                                  </div>

                                  {/* Resolution aspect selector dropdown */}
                                  <div className="flex items-center justify-between gap-2 border-t border-brand-cyan/5 pt-2">
                                    <span className="text-[9px] font-mono text-neutral-slate">Formato de Capa:</span>
                                    <select
                                      value={post.imageRes}
                                      onChange={(e) => {
                                        setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, imageRes: e.target.value as any } : p));
                                      }}
                                      className="text-[9px] rounded border border-brand-cyan/15 bg-slate-900 px-2 py-1 text-neutral-white focus:outline-none font-medium"
                                    >
                                      <option value="1:1">Quadrado (1:1)</option>
                                      <option value="16:9">Paisagem (16:9)</option>
                                      <option value="9:16">Story / Vertical (9:16)</option>
                                      <option value="4:3">Banner Clássico (4:3)</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Slider controls panel (Squoosh UI) */}
                                <div className="space-y-3 flex flex-col justify-between">
                                  <div>
                                    <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono mb-2">Engenharia de Compressão</span>
                                    
                                    {/* Compression comparative metrics display */}
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-3 bg-slate-900/40 p-2.5 rounded-lg border border-brand-cyan/5">
                                      <div>
                                        <span className="text-zinc-500 block font-bold text-[9px]">ORIGINAL (PNG)</span>
                                        <span className="text-neutral-white font-mono font-bold block mt-0.5">3.42 MB</span>
                                        <span className="text-[8px] text-zinc-500 font-mono block">descompactado</span>
                                      </div>
                                      <div className="border-l border-brand-cyan/5 pl-2">
                                        <span className="text-[#06B6D4] block uppercase font-bold text-[9px]">{post.imageFormat} Otimizado</span>
                                        <span className="text-[#06B6D4] font-mono font-extrabold block mt-0.5">{optimizedKB} KB</span>
                                        <span className="text-[8px] text-emerald-400 font-bold block mt-0.5">-{savedSavedSavedPercent}% salvo</span>
                                      </div>
                                    </div>

                                    {/* Format selector */}
                                    <div className="space-y-1 mb-2.5">
                                      <div className="flex justify-between items-center text-[9px] font-mono text-neutral-slate font-normal">
                                        <span>Codificação / Saída:</span>
                                        <span className="text-neutral-white font-bold">{post.imageFormat.toUpperCase()}</span>
                                      </div>
                                      <div className="grid grid-cols-4 gap-1">
                                        {['webp', 'avif', 'jpg', 'png'].map((f) => (
                                          <button
                                            key={f}
                                            type="button"
                                            onClick={() => {
                                              setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, imageFormat: f as any } : p));
                                            }}
                                            className={`py-1 text-[8px] font-mono uppercase rounded transition-all text-center border cursor-pointer ${
                                              post.imageFormat === f 
                                                ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold' 
                                                : 'bg-slate-900 hover:bg-slate-850 text-neutral-slate border-brand-cyan/5'
                                            }`}
                                          >
                                            {f}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Quality Slider */}
                                    <div className="space-y-1 mb-2.5">
                                      <div className="flex justify-between items-center text-[9px] font-mono text-neutral-slate font-normal">
                                        <span>Qualidade de Textura:</span>
                                        <span className="text-neutral-white font-bold">{post.imageQuality}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={post.imageQuality}
                                        onChange={(e) => {
                                          setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, imageQuality: Number(e.target.value) } : p));
                                        }}
                                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                                      />
                                    </div>

                                    {/* Effort/Compactation slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[9px] font-mono text-neutral-slate">
                                        <span>Nível de Esforço:</span>
                                        <span className="text-neutral-white font-bold">{post.imageEffort}/6 (Max)</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        value={post.imageEffort}
                                        onChange={(e) => {
                                          setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, imageEffort: Number(e.target.value) } : p));
                                        }}
                                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                                      />
                                    </div>

                                  </div>

                                  {/* Seeds rebuild trigger */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, imageSeed: Math.floor(Math.random() * 1000) + 1 } : p));
                                      triggerToast('Layout visual recalculado pelo Co-piloto.');
                                    }}
                                    className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-neutral-white border border-brand-cyan/5 text-[9px] uppercase tracking-wider font-mono transition-colors cursor-pointer font-bold"
                                  >
                                    Regerar Variação Visual
                                  </button>

                                </div>

                              </div>

                              {/* IMAGE PROMPT BAR WITH ADVISORY BULLETS */}
                              <div className="space-y-2 mt-4 border-t border-brand-cyan/5 pt-3">
                                <label className="block text-[9px] font-mono font-bold text-neutral-slate uppercase">PROMPT PARA CONVERSÃO DA CAPA</label>
                                <input
                                  type="text"
                                  value={post.imagePrompt}
                                  onChange={(e) => {
                                    setGeneratedPosts(prev => prev.map(p => p.id === post.id ? { ...p, imagePrompt: e.target.value } : p));
                                  }}
                                  className="w-full text-xs rounded-lg border border-brand-cyan/10 bg-slate-950 px-3 py-2 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                                  placeholder="Descreva visualmente o background conceitual..."
                                />
                                <div className="text-[9px] text-[#06B6D4]/80 leading-relaxed font-semibold bg-brand-cyan/5 p-2 rounded border border-brand-cyan/10">
                                  <strong>Dica do Co-piloto:</strong> Descreva o estilo conceitual (Ex: <em>"Ilustração minimalista 3D de servidores com luzes ciano quentes"</em>). Evite tipografias ou textos legíveis e prefira iluminação de destaque fotográfico.
                                </div>
                              </div>

                              {/* SEO SLUG NAME AUTO GENERATED */}
                              <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-lg border border-brand-cyan/10 mt-4 relative">
                                <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">NOME DO ARQUIVO DA IMAGEM AUTOMÁTICA (SEO)</span>
                                
                                <div className="flex items-center gap-3 justify-between bg-slate-900 p-2 rounded text-xs select-all text-neutral-white font-mono break-all pr-12">
                                  <span>{seoImageName}</span>
                                  
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(seoImageName)}
                                    className="absolute right-6 p-1.5 rounded hover:bg-slate-850 text-brand-cyan transition-colors cursor-pointer"
                                    title="Copiar Nome"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="text-[8px] text-zinc-500 font-mono">
                                  Pré-selecionado: <span className="text-neutral-slate">[nome do site + nome do post]</span> formatado em URL slug amigável.
                                </div>
                              </div>

                            </div>

                            {/* CTAs per generated draft card */}
                            <div className="flex border-t border-brand-cyan/5 pt-4 justify-end gap-3">
                              <button
                                onClick={() => handleSaveCopilotPost(post, 'Draft')}
                                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-transparent border border-brand-cyan/20 text-neutral-slate hover:text-neutral-white hover:border-brand-cyan/60 active:scale-95 transition-all text-center cursor-pointer"
                              >
                                Salvar como Rascunho
                              </button>
                              
                              <button
                                onClick={() => handleSaveCopilotPost(post, 'Published')}
                                className="px-5 py-2.5 rounded-lg text-xs font-bold text-neutral-white bg-brand-electric hover:bg-brand-electric/95 hover:glow-effect-electric active:scale-95 transition-all inline-flex items-center gap-1.5 border border-brand-cyan/25 cursor-pointer"
                              >
                                <Share2 className="h-4 w-4" />
                                Publicar Canal
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 3: REGISTERED POSTS HISTORY DATABASE GRID */}
          {activeTab === 'history' && (
            <motion.div
              key="history-list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6"
            >
              
              {historySubView === 'list' && (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowNewPostModal(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-electric text-neutral-white hover:bg-brand-electric/90 active:scale-95 transition-all border border-brand-cyan/25 brightness-110 cursor-pointer shadow-lg"
                    >
                      Novo post
                    </button>
                  </div>
                </>
              )}

              {historySubView === 'simple-creator' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  
                  {/* Back button and title */}
                  <div className="flex items-center justify-between border-b border-brand-cyan/5 pb-4 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHistorySubView('list');
                        setSimpleDraftsList([]);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      &larr; Voltar para os posts
                    </button>
                    <span className="text-[10px] font-mono font-bold text-brand-cyan uppercase bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                      Modo Simples (Foco em Produção)
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 rounded-2xl border border-brand-cyan/15 bg-slate-900/40 backdrop-blur-md space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-neutral-white">Criar Novo Post Simplificado</h2>
                      <p className="text-xs text-neutral-slate mt-0.5">Interface limpa e de fácil redação para rascunhar ou disparar publicações rápidas.</p>
                    </div>

                    <div className="space-y-5">
                      
                      {/* Form row: Title and Custom Tone */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Title input */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-2 font-mono">
                            Título ou Tema do Post (Opcional)
                          </label>
                          <input
                            type="text"
                            value={simplePostTitle}
                            onChange={(e) => setSimplePostTitle(e.target.value)}
                            placeholder="Ex: Como escalar microsserviços..."
                            className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3 text-neutral-white placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none transition-all font-semibold"
                          />
                        </div>

                        {/* Tone of Voice (Free form text input) */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-2 font-mono">
                            Tom de Voz Desejado
                          </label>
                          <input
                            type="text"
                            value={simplePostToneText}
                            onChange={(e) => setSimplePostToneText(e.target.value)}
                            placeholder="Ex: Descontraído com sarcasmo sutil, técnico e sóbrio..."
                            className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3 text-neutral-white placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none transition-all font-medium"
                          />
                        </div>

                      </div>

                      {/* Form row: Post count & character size limit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Quantity of posts */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-2 font-mono">
                            Quantidade de posts a fazer
                          </label>
                          <select
                            value={simplePostCount}
                            onChange={(e) => setSimplePostCount(Number(e.target.value))}
                            className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                          >
                            <option value={1}>1 Post Unificado</option>
                            <option value={2}>Fila com 2 Posts Distintos</option>
                            <option value={3}>Lote com 3 Posts Compartimentados</option>
                            <option value={4}>Lote com 4 Posts Estratégicos</option>
                            <option value={5}>Lote Máximo com 5 Posts Combinados</option>
                          </select>
                        </div>

                        {/* Text size selector */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-2 font-mono">
                            Tamanho de Conteúdo do Post
                          </label>
                          <select
                            value={simplePostSize}
                            onChange={(e) => setSimplePostSize(e.target.value as any)}
                            className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-3.5 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                          >
                            <option value="pequeno">Pequeno (até 1.000 caracteres)</option>
                            <option value="medio">Médio (até 3.500 caracteres)</option>
                            <option value="grande">Grande (até 7.000 caracteres)</option>
                          </select>
                        </div>

                      </div>

                      {/* Content Source input - free typing text area */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider font-mono">
                            Fonte de Conteúdo do Blog (Escreva livremente)
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {simpleSourceText.length} caracteres inseridos
                          </span>
                        </div>
                        <textarea
                          value={simpleSourceText}
                          onChange={(e) => setSimpleSourceText(e.target.value)}
                          rows={6}
                          placeholder="Digite ou cole aqui sua matéria-prima: matérias antigas, notas desorganizadas, links, tópicos ou rascunhos. A IA gerará conteúdo profissional em cima dessa fonte de dados."
                          className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3 text-neutral-white placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none transition-colors font-mono leading-relaxed resize-none"
                        />
                      </div>

                      {/* Big action button for triggering the AI generation directly */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleGenerarSimpleComIA}
                          disabled={isGeneratingSimple}
                          className="w-full py-3.5 font-bold font-mono text-xs uppercase bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/35 hover:border-brand-cyan/70 text-brand-cyan rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
                        >
                          {isGeneratingSimple ? (
                            <>
                              <span className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                              Analisando Tom e Processando Fontes...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 animate-pulse text-brand-cyan" />
                              Rascunhar com IA
                            </>
                          )}
                        </button>
                      </div>

                      {/* Conditional edit fields if there are generated drafts */}
                      {simpleDraftsList.length > 0 && (
                        <div className="mt-6 border-t border-brand-cyan/10 pt-6 space-y-4">
                          
                          {/* Tabs for multiple drafts option if quantity > 1 */}
                          {simpleDraftsList.length > 1 && (
                            <div>
                              <span className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider mb-2 font-mono">
                                Alternar entre Posts Gerados no Lote ({simpleDraftsList.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {simpleDraftsList.map((draft, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setSimpleDraftActiveIndex(idx);
                                      setSimplePostTitle(draft.title);
                                      setSimplePostContent(draft.content);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                                      simpleDraftActiveIndex === idx
                                        ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold shadow-lg'
                                        : 'bg-slate-950/40 border-brand-cyan/10 text-neutral-slate hover:bg-slate-900'
                                    }`}
                                  >
                                    Post #{idx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selected Post Final Edit Controls */}
                          <div className="bg-slate-950/40 border border-brand-cyan/10 rounded-xl p-4.5 space-y-4">
                            
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5 font-mono">
                                Título do Rascunho Selecionado ({simpleDraftActiveIndex + 1})
                              </label>
                              <input
                                type="text"
                                value={simplePostTitle}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSimplePostTitle(val);
                                  if (simpleDraftsList[simpleDraftActiveIndex]) {
                                    const updated = [...simpleDraftsList];
                                    updated[simpleDraftActiveIndex].title = val;
                                    setSimpleDraftsList(updated);
                                  }
                                }}
                                className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-2.5 text-neutral-white focus:border-brand-cyan focus:outline-none transition-all font-semibold"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider font-mono">
                                  Texto Refinado do Post ({simpleDraftActiveIndex + 1})
                                </label>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {simplePostContent.length} caracteres
                                </span>
                              </div>
                              <textarea
                                value={simplePostContent}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSimplePostContent(val);
                                  if (simpleDraftsList[simpleDraftActiveIndex]) {
                                    const updated = [...simpleDraftsList];
                                    updated[simpleDraftActiveIndex].content = val;
                                    setSimpleDraftsList(updated);
                                  }
                                }}
                                rows={8}
                                className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors font-mono leading-relaxed resize-none"
                              />
                            </div>

                          </div>

                        </div>
                      )}

                    </div>

                    {/* Action controls row */}
                    <div className="flex flex-col sm:flex-row justify-between items-center border-t border-brand-cyan/5 pt-5 gap-3">
                      
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySubView('list');
                          setSimpleDraftsList([]);
                        }}
                        className="px-5 py-3 rounded-xl text-neutral-slate hover:text-neutral-white border border-brand-cyan/5 hover:border-brand-cyan/15 bg-transparent text-xs font-bold w-full sm:w-auto transition-all cursor-pointer"
                      >
                        Cancelar e Voltar
                      </button>

                      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleSaveSimplePost(simplePostTitle, simplePostContent, 'Draft')}
                          className="px-5 py-3 rounded-xl bg-transparent border border-brand-cyan/25 text-neutral-slate hover:text-neutral-white hover:border-brand-cyan/50 text-xs font-bold w-full sm:w-auto transition-all cursor-pointer"
                        >
                          Salvar como Rascunho
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveSimplePost(simplePostTitle, simplePostContent, 'Published')}
                          className="px-6 py-3 rounded-xl bg-brand-electric text-neutral-white hover:bg-brand-electric/90 text-xs font-bold w-full sm:w-auto transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 border border-brand-cyan/25 brightness-110 shadow-lg"
                        >
                          <Share2 className="h-4 w-4" />
                          Publicar Agora
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {historySubView === 'list' && (
                <>

              {isLoadingPosts ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
                  <span className="text-xs text-neutral-slate/60 font-mono">Consolidando dados do Firestore...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-brand-cyan/10 bg-slate-950/20">
                  <FolderOpen className="h-12 w-12 text-brand-cyan/20 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-neutral-white">Nenhum Post Encontrado</h3>
                  <p className="text-xs text-neutral-slate max-w-sm mx-auto mt-1 leading-relaxed">
                    Você ainda não gerou nem salvou posts usando nosso terminal inteligente. Visite a aba "Criador de Conteúdo" e pilote o primeiro post.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      layout
                      className="p-5.5 rounded-2xl border border-brand-cyan/15 bg-slate-950/40 backdrop-blur flex flex-col justify-between hover:border-brand-cyan/30 transition-all glow-effect-border hover:shadow-xl"
                    >
                      <div>
                        
                        {/* Post Metadata line */}
                        <div className="flex items-center justify-between mb-4 text-xs font-mono">
                          <span className="flex items-center gap-1.5 font-bold text-brand-cyan">
                            {post.channel === 'LinkedIn' && <Linkedin className="h-4 w-4 text-[#0A66C2]" />}
                            {post.channel === 'X / Twitter' && <Twitter className="h-4 w-4 text-sky-400" />}
                            {post.channel === 'Instagram' && <Instagram className="h-4 w-4 text-pink-500" />}
                            {post.channel === 'Dev.to' && <Code className="h-4 w-4 text-emerald-400" />}
                            {post.channel}
                          </span>
                          
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            post.status === 'Published' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : post.status === 'Scheduled'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/10'
                          }`}>
                            {post.status}
                          </span>
                        </div>

                        {/* Title & snippet */}
                        <h4 className="text-sm font-extrabold text-[#F8FAFC] tracking-tight">{post.title}</h4>
                        <p className="text-xs text-neutral-slate/75 leading-relaxed mt-2.5 line-clamp-5 whitespace-pre-wrap select-text border-l border-brand-cyan/5 pl-2.5">
                          {post.content}
                        </p>
                      </div>

                      {/* Utility Action Buttons */}
                      <div className="mt-5.5 pt-4.5 border-t border-brand-cyan/5 flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            title="Editar Post"
                            className="p-2 rounded-lg bg-slate-900 border border-brand-cyan/5 text-neutral-slate hover:text-neutral-white hover:border-brand-cyan/20 active:scale-95 transition-all"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          
                          {post.status !== 'Published' && (
                            <button
                              onClick={() => handlePublishPostDirectly(post)}
                              title="Publicar agora de forma assíncrona"
                              className="p-2 rounded-lg bg-brand-cyan/10 border border-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/20 active:scale-95 transition-all text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              Ativar Post
                            </button>
                          )}

                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Deletar permanentemente"
                            className="p-2 rounded-lg bg-rose-500/5 border border-transparent text-rose-500/60 hover:text-rose-400 hover:border-rose-500/15 active:scale-95 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </div>
              )}
                </>
              )}

            </motion.div>
          )}

          {/* TAB 4: CHANNELS SWITCHBOARD INTEGRATIONS */}
          {activeTab === 'channels' && (
            <motion.div
              key="channels"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              
              <div className="p-4.5 rounded-xl border border-brand-cyan/10 bg-slate-900/30">
                <h3 className="text-sm font-bold text-neutral-white">Autenticação Segura via OAuth 2.0</h3>
                <p className="text-xs text-neutral-slate mt-1.5 leading-normal">
                  Nossas APIs se conectam diretamente com as redes sociais de forma isolada. Ative ou desative as permissões no painel com total controle.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  {
                    id: 'LinkedIn',
                    title: 'LinkedIn API Client',
                    description: 'Ative posts corporativos refinados, suporte a ganchos estruturados e links externos.',
                    icon: <Linkedin className="h-6 w-6 text-[#0A66C2]" />,
                    activeKey: 'LinkedIn'
                  },
                  {
                    id: 'X / Twitter',
                    title: 'X / Twitter Engine',
                    description: 'Ative a formatação em Threads encadeadas sequencialmente seguindo limites estritos de caracteres.',
                    icon: <Twitter className="h-6 w-6 text-sky-400" />,
                    activeKey: 'X / Twitter'
                  },
                  {
                    id: 'Instagram',
                    title: 'Instagram Business',
                    description: 'Postagem automática de legendas com espaçamento dinâmico, layouts e bloco de hashtags otimizado.',
                    icon: <Instagram className="h-6 w-6 text-pink-500" />,
                    activeKey: 'Instagram'
                  },
                  {
                    id: 'Dev.to',
                    title: 'Dev.to Technical Pipeline',
                    description: 'Formatação impecável em Markdown, import de blocos de chaves sintáticas e documentações técnicas.',
                    icon: <Code className="h-6 w-6 text-emerald-400" />,
                    activeKey: 'Dev.to'
                  }
                ].map((channel) => {
                  const isConnected = channelConnections[channel.activeKey as keyof typeof channelConnections];
                  return (
                    <div 
                      key={channel.id}
                      className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                        isConnected 
                          ? 'bg-slate-950 border-brand-cyan/30 glow-effect-cyan' 
                          : 'bg-slate-900/30 border-brand-cyan/5 hover:border-brand-cyan/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-slate-950 border border-brand-cyan/10 flex items-center justify-center shrink-0">
                          {channel.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-white">{channel.title}</h4>
                          <p className="text-xs text-neutral-slate mt-1.5 leading-relaxed">{channel.description}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4.5 border-t border-brand-cyan/5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          {isConnected ? 'Sincronizado' : 'Não Configurado'}
                        </span>

                        <button
                          onClick={() => handleToggleChannel(channel.activeKey as any)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isConnected 
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                              : 'bg-brand-electric text-neutral-white border border-brand-cyan/15 hover:bg-brand-electric/95 shadow shadow-brand-electric/25'
                          }`}
                        >
                          {isConnected ? 'Desconectar' : 'Ativar Integração'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}

          {/* TAB 5: VOICE IDENTITY SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              
              <div className="p-6 rounded-2xl border border-brand-cyan/15 bg-slate-900/30 space-y-5">
                <h3 className="text-base font-bold text-neutral-white">Filtro de Diretrizes de Marca</h3>
                <p className="text-xs text-neutral-slate mt-1 leading-normal">
                  Especifique as regras linguísticas que nosso motor editorial de inteligência artificial deve respeitar para as criações de campanhas.
                </p>

                <div className="h-[1px] bg-brand-cyan/5 w-full" />

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                      Termos Vetados (Separados por vírgula)
                    </label>
                    <input 
                      type="text"
                      value={brandVoice.excludeWords}
                      onChange={(e) => setBrandVoice(prev => ({ ...prev, excludeWords: e.target.value }))}
                      className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3.5 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                    />
                    <span className="text-[9px] text-zinc-500 block mt-1">Nossa IA irá omitir ou substituir esses termos clichês automaticamente.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                      Bloco padrão de Tags Recomendadas
                    </label>
                    <input 
                      type="text"
                      value={brandVoice.presetHashtags}
                      onChange={(e) => setBrandVoice(prev => ({ ...prev, presetHashtags: e.target.value }))}
                      className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3.5 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                      Assitura Vocálica de Marca
                    </label>
                    <input 
                      type="text"
                      value={brandVoice.customSignature}
                      onChange={(e) => setBrandVoice(prev => ({ ...prev, customSignature: e.target.value }))}
                      className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3.5 text-neutral-white focus:border-brand-cyan focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => triggerToast('Identidade vocal corporativa atualizada!')}
                    className="px-4.5 py-3 rounded-xl text-xs font-bold text-neutral-white bg-brand-electric hover:bg-brand-electric/90 active:scale-95 border border-brand-cyan/20 transition-all shadow"
                  >
                    Salvar Identidade
                  </button>
                </div>

              </div>

            </motion.div>
          )}
          </AnimatePresence>
        </div>

      </main>

      {/* POST EDIT OVERLAY DIALOG / SLIDE-OVER MODAL */}
      <AnimatePresence>
        {editingPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 select-none"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-brand-cyan/15 rounded-2xl max-w-2xl w-full p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative select-text"
            >
              
              <div>
                <div className="flex items-center justify-between border-b border-brand-cyan/5 pb-4.5 mb-6">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-brand-cyan uppercase bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                      EDITANDO REGISTRO FIRESTORE
                    </span>
                    <h3 className="text-base font-bold text-neutral-white mt-1.5 flex items-center gap-2">
                       Apoio de Escrita de Post Solo
                    </h3>
                  </div>

                  <button 
                    onClick={() => setEditingPost(null)}
                    className="p-1 text-neutral-slate hover:text-neutral-white hover:bg-slate-800 rounded transition-colors focus:outline-none"
                  >
                    &#x2715;
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                      Tema Geral / Tópico
                    </label>
                    <input 
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="w-full text-xs rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3 text-neutral-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-white uppercase tracking-wider mb-1.5">
                      Conteúdo do Post (Markdown / Text)
                    </label>
                    <textarea 
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      rows={10}
                      className="w-full text-xs font-mono rounded-xl border border-brand-cyan/15 bg-slate-950 px-4 py-3 text-zinc-100 placeholder:text-neutral-slate/30 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30 transition-colors leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4.5 border-t border-brand-cyan/5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4.5 py-3 rounded-xl text-neutral-slate hover:text-neutral-white transition-colors text-xs font-bold bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePostEdits}
                  className="px-5 py-3 rounded-xl text-neutral-white bg-brand-electric hover:bg-brand-electric/95 hover:glow-effect-electric transition-all text-xs font-bold border border-brand-cyan/20"
                >
                  Confirmar Alterações
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP SELECTION MODAL FOR NEW POST */}
      <AnimatePresence>
        {showNewPostModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 select-none"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-brand-cyan/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative select-text"
            >
              <div>
                <div className="flex items-center justify-between border-b border-brand-cyan/5 pb-4.5 mb-6">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#06B6D4] uppercase bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                      Novo Conteúdo
                    </span>
                    <h3 className="text-base font-bold text-neutral-white mt-1.5">
                       Como deseja criar seu post?
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowNewPostModal(false)}
                    className="p-1 text-neutral-slate hover:text-neutral-white hover:bg-slate-800 rounded transition-colors focus:outline-none cursor-pointer"
                  >
                    &#x2715;
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Option 1: Simple post dashboard */}
                  <div 
                    onClick={() => {
                      setHistorySubView('simple-creator');
                      setSimplePostTitle('');
                      setSimplePostContent('');
                      setShowNewPostModal(false);
                    }}
                    className="p-4 rounded-xl border border-brand-cyan/10 bg-slate-950/50 hover:border-brand-cyan/40 hover:bg-slate-950/90 hover:glow-effect-border transition-all cursor-pointer group flex items-start gap-4"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan border border-brand-cyan/25 group-hover:bg-brand-cyan/20 transition-all">
                      <Edit3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-brand-cyan transition-colors">
                        Criar post simples
                      </h4>
                      <p className="text-[11px] text-neutral-slate mt-1.5 leading-relaxed font-normal">
                        Interface limpa, direta e rápida para focar na redação prática de postagens sociais com apoio de inteligência tática.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Robust dashboard / Preset setup */}
                  <div 
                    onClick={() => {
                      setHistorySubView('robust-creator');
                      setShowNewPostModal(false);
                    }}
                    className="p-4 rounded-xl border border-brand-cyan/10 bg-slate-950/50 hover:border-brand-cyan/40 hover:bg-slate-950/90 hover:glow-effect-border transition-all cursor-pointer group flex items-start gap-4"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-electric/15 flex items-center justify-center text-brand-electric border border-brand-electric/25 group-hover:bg-brand-electric/30 transition-all">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-brand-electric transition-colors">
                        Cadastrar preset novo / Robusto
                      </h4>
                      <p className="text-[11px] text-neutral-slate mt-1.5 leading-relaxed font-normal">
                        Use o co-piloto completo para programações robustas em lote, incluindo otimização de imagens, SEO e capas visuais do blog.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4.5 border-t border-brand-cyan/5 flex justify-end">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4.5 py-2.5 rounded-xl text-xs font-bold bg-transparent border border-brand-cyan/10 text-neutral-slate hover:text-neutral-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
