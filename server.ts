import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Initialize GoogleGenAI client (will lazy-load if key is check on call)
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('WARNING: GEMINI_API_KEY is not defined. AI functionality will be using mock mode.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST route for content generation
app.post('/api/generate', async (req: express.Request, res: express.Response) => {
  try {
    const { prompt, channel, tone } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt é obrigatório.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Fallback Mock generator if API Key is not set or invalid
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MOCK')) {
      // Simulate real content based on inputs
      setTimeout(() => {
        const mockPrompt = prompt.substring(0, 100);
        let content = '';
        if (channel === 'X / Twitter') {
          content = `🚀 Otimização é a chave do crescimento! 💡\n\nFalando sobre "${mockPrompt}": o segredo está na consistência e automação em escala. O que você acha disso?\n\nVeja as 3 etapas essenciais:\n1️⃣ Planejamento estruturado\n2️⃣ Geração inteligente de rascunhos\n3️⃣ Otimização contínua\n\n💬 Deixe sua opinião na thread abaixo!\n\n#SaaS #MarketingDigital #SaaSAutomations #${channel.replace(/\s+/g, '')}`;
        } else if (channel === 'LinkedIn') {
          content = `Ontem me perguntei: Como construir uma presença sólida sobre "${mockPrompt}" sem esgotar minhas forças?\n\nA resposta veio em forma de dados e testes empíricos. Na era pós-IA, quem escreve tudo manualmente está perdendo tempo. A verdadeira competência competitiva está na curadoria e direção de arte literária.\n\nAbaixo descrevo os resultados obtidos:\n\n📈 1. Escala inteligente: produzir de forma estratégica.\n✨ 2. Identidade vocal: manter o tom de voz elegante, conciso e autêntico.\n♻️ 3. Distribuição multicanal: o mesmo insight formatado de forma customizada.\n\nE você, como tem pilotado a distribuição de conteúdo do seu SaaS? Conta pra mim nos comentários 👇\n\n#SocialMediaStrategy #MarketingDePerformance #SaaS #GrowthHacking`;
        } else if (channel === 'Instagram') {
          content = `COMO EXPLODIR SEU ENGAGEMENT COM "${mockPrompt.toUpperCase()}" 💥👇\n\nSalve este post para não perder!\n\n📌 1. ENTENDA SEU PÚBLICO: Não tente vender antes de educar.\n📌 2. O TIMING PERFEITO: Publique quando sua base estiver mais ativa.\n📌 3. FORMATO DO POST: Carrosséis geram 3x mais compartilhamentos do que imagens estáticas.\n\nQuer dominar isso no piloto automático? O link na nossa Bio te ensina como criar 30 posts em menos de 5 minutos!\n\n#DicasDeMarketing #AlgoritmoInstagram #ConteudoComIA #EstiloDeVida #MarketingDigital`;
        } else {
          content = `# O Guia Completo para Dominar: ${prompt}\n\n*Por Agente Editorial Pilot Content*\n\nSeja bem-vindo a uma análise aprofundada sobre as melhores abordagens para **"${prompt}"**.\n\nNeste artigo técnico, vamos destrinchar como a automação de produção editorial impulsiona novos patamares de tráfego, garantindo conversão acima da média do mercado.\n\n## Introdução e Contexto\n\nDominar este tema demanda um cuidadoso equilíbrio entre técnica e criatividade. Ao adotarmos novas tecnologias baseadas em Inteligência Artificial, reduzimos gargalos operacionais e elevamos a qualidade visual e tipográfica do produto final.\n\n## 3 Pilares Indispensáveis\n\n1. **Pesquisa Detalhada**: Buscar referências reais e semânticas antes da concepção.\n2. **Otimização Hierárquica**: Usar headings estruturados (H2, H3), bullet points claros e respiros visuais.\n3. **Mapeamento de SEO**: Posicionar palavras-chave-alvo de modo natural.\n\nQual é a sua estratégia preferida? Compartilhe seus resultados!\n\n--- \n*Feito com o poder do Pilot Content SaaS.*`;
        }
        res.json({ text: content });
      }, 1200);
      return;
    }

    const ai = getAIClient();
    const systemPrompt = `Você é o redator sênior do SaaS Pilot Content.
Sua missão é gerar um post impecável, super envolvente, gramaticalmente perfeito e extremamente contextual baseado nas diretrizes fornecidas.
- Rede Social de Destino: ${channel}
- Tom de Voz Escolhido: ${tone}
- Tema/Prompt do Usuário: "${prompt}"

Instruções específicas por rede:
- "X / Twitter": Escreva uma thread curta ou um post solo extremamente impactante, com limite estrito de caracteres, que estimule retweets e interações. Adicione quebras de linha elegantes e hashtags pertinentes de modo discreto.
- "LinkedIn": Adote uma abordagem executiva de storytelling corporativo, estruturada em parágrafos curtos, gerando curiosidade nas primeiras linhas (gancho) e terminando com um "Call to Action" estimulante.
- "Instagram": Escreva legendas visualmente amigáveis, com uso adequado de emojis para demarcar listas, espaçamentos amplos e um bloco de hashtags recomendadas ao final.
- "Dev.to": Gere um artigo estruturado em Markdown, com introdução, títulos bem definidos (H2/H3), blocos explicativos e conclusão refinada.

Escreva apenas o conteúdo final gerado, sem comentários adicionais nem tags explicativas de sua parte (ex: "Aqui está o post"). Entregue a copy pronta para publicação. O idioma deve ser estritamente Português do Brasil.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
    });

    const text = response.text || 'Não foi possível gerar conteúdo.';
    res.json({ text });
  } catch (error: any) {
    console.error('Erro de geração do Gemini:', error);
    res.status(500).json({ error: error?.message || 'Erro interno ao processar requisição.' });
  }
});

// REST route for Copilot Multi-Post Generation
app.post('/api/generate-copilot', async (req: express.Request, res: express.Response) => {
  try {
    const { blogSource, customBlogText, creatorTopic, count } = req.body;
    const numPosts = Number(count) || 1;

    const apiKey = process.env.GEMINI_API_KEY;

    // Use Mock fallback if there is no real API key or it is in simulation mode
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MOCK')) {
      const simulated: any[] = [];
      const titlesBySource: Record<string, string[]> = {
        vite: [
          "Reduzindo Bundle do React: de 45s a menos de 4s no build do Vite",
          "Removendo dependências pesadas e limpando bundle sizes no Vite",
          "Otimização tática de HMR e cache persistente para giga-codebases",
          "Como estruturar imports dinâmicos React com Tipagem TypeScript Pura",
          "Tree-shaking no Vite: eliminando trechos inativos do editor principal"
        ],
        lgpd: [
          "Manual de LGPD para SaaS: Como garantir conformidade e proteção tática",
          "Criptografia ponta a ponta e logs de auditoria em backends modernos",
          "Gestão de cookies e trackers de marketing: Evitando riscos desnecessários",
          "Arquitetura avançada de logs e anonimização dinâmica de dados pessoais",
          "Tratamento de metadados sensíveis na nuvem: Guia tático da infraestrutura"
        ],
        bootstrap: [
          "Bootstrapping Sustentável: Como crescer sem queimar margem operacional",
          "As Métricas Reais do Bootstrap: LTV/CAC e payback de fluxo de caixa",
          "Monetização no Dia 1: Estratégias de faturamento com ferramentas SaaS",
          "Foco no Produto e eliminação de distrações em interfaces de conversão",
          "Equilíbrio de Custos e Break-Even Rápido para Solopreneurs"
        ]
      };

      const categories = ["Performance", "Segurança", "Finanças", "Estratégia", "Tecnologia", "Produto", "DevOps"];
      const images = [
        "Isometric software server room with clean neon cyan lasers slicing through dark abstract digital clusters, 3D render, dark metallic floor",
        "Minimal compression box glowing with cyan light containing abstract crystal cubes, dark slate surface, professional, premium style",
        "Glowing neon data loops going into a sleek dark storage processor, reflections, futuristic ultra-refined design",
        "Clean interconnected glass cubes with glowing neon blue connectors, dark reflective floor, elegant studio setup",
        "Sleek glowing futuristic laser cutting away dead digital foliage, digital holographic tree, dark premium background"
      ];

      for (let i = 0; i < numPosts; i++) {
        const sourceTitles = titlesBySource[blogSource] || [];
        const baseTitle = sourceTitles[i % sourceTitles.length] || `${creatorTopic || 'Conteúdo Estratégico'} - Post #${i + 1}`;
        const cat = blogSource === 'vite' ? 'Performance' : (blogSource === 'lgpd' ? 'Segurança' : (blogSource === 'bootstrap' ? 'Finanças' : categories[i % categories.length]));
        
        simulated.push({
          title: `[MOCK] ${baseTitle}`,
          content: `🚀 Insights exclusivos sobre ${baseTitle}.\n\nAo explorarmos este escopo, identificamos gargalos fundamentais do mercado. Um planejamento refinado traz os seguintes diferenciais competitivos:\n\n1️⃣ Escalabilidade operacional consistente\n2️⃣ Otimização detalhada nos canais de distribuição\n3️⃣ Autoatendimento e menor fricção transacional\n\nQual é o seu posicionamento sobre esta pauta do mercado?\n\n#SaaS #Inovação #Productivity #${cat}`,
          category: cat,
          tags: `${blogSource || 'tecnologia'}, saas, inovacao, marketing`,
          imagePrompt: images[i % images.length]
        });
      }

      res.json({ posts: simulated });
      return;
    }

    const ai = getAIClient();
    const cleanTopic = creatorTopic?.trim() || 'Inovação e SaaS';
    const sourceContext = customBlogText?.trim() ? `Aqui estão notas e matérias de apoio inseridas pelo usuário:\n"${customBlogText}"` : 'Use conhecimentos gerais atualizados sobre o tema.';

    const systemPrompt = `Você é o Co-piloto Editorial do SaaS Pilot Content.
Sua missão é gerar um lote contendo exatamente ${numPosts} rascunhos de posts profissionais extremamente envolventes, baseados nos parâmetros enviados pelo usuário.

Tema central: "${cleanTopic}"
Blog Source selecionado: "${blogSource}"
Fonte e contexto de apoio:
${sourceContext}

Você deve gerar exatamente ${numPosts} post(s). Não gere mais nem menos.
Preencha cada objeto do array exatamente conforme as propriedades definidas no formato do JSON. Escreva em Português do Brasil.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: `Uma lista contendo exatamente ${numPosts} rascunhos de posts estruturados.`,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Título provocativo, focado em cliques e cliques qualificados.' },
              content: { type: Type.STRING, description: 'Conteúdo textual completo do post adaptado para redes profissionais, com espaçamento limpo, ganchos e CTAs.' },
              category: { type: Type.STRING, description: 'Categoria curta que melhor classifica o post (ex: Performance, Tecnologia, Finanças, Estratégia, Segurança, DevOps).' },
              tags: { type: Type.STRING, description: 'Lista de 3 a 5 tags separadas por vírgula e minúsculas.' },
              imagePrompt: { type: Type.STRING, description: 'Prompt descritivo e visual em inglês para criar uma imagem abstrata futurista premium em 3D sobre o tema do post.' }
            },
            required: ['title', 'content', 'category', 'tags', 'imagePrompt']
          }
        }
      }
    });

    const jsonText = response.text?.trim() || '[]';
    try {
      const posts = JSON.parse(jsonText);
      res.json({ posts });
    } catch {
      res.status(500).json({ error: 'Erro ao analisar JSON enviado pelo modelo.', raw: jsonText });
    }

  } catch (error: any) {
    console.error('Erro de geração no Co-piloto:', error);
    res.status(500).json({ error: error?.message || 'Erro interno ao processar requisição no Co-piloto.' });
  }
});

// REST route for Simple Generator with Custom Voice Tone
app.post('/api/generate-simple', async (req: express.Request, res: express.Response) => {
  try {
    const { title, sourceText, toneText, count, size } = req.body;
    const numPosts = Number(count) || 1;
    const selectedSize = size || 'medio';
    const userTone = toneText?.trim() || 'Profissional e técnico';

    const apiKey = process.env.GEMINI_API_KEY;

    // Use Mock fallback if there is no real API key or it is a mock environment
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MOCK')) {
      const simulated: any[] = [];
      const sizeDesc = selectedSize === 'pequeno' ? 'Pequeno (até 1000 caract.)' : (selectedSize === 'grande' ? 'Grande (até 7000 caract.)' : 'Médio (até 3500 caract.)');

      for (let i = 1; i <= numPosts; i++) {
        const currentTitle = title?.trim() ? `${title}${numPosts > 1 ? ` (Variação #${i})` : ''}` : `Geração Estratégica Inteligente #${i}`;
        
        let text = '';
        if (selectedSize === 'pequeno') {
          text = `🎯 [[MOCK] RASCUNHO RÁPIDO - TOM: ${userTone.toUpperCase()}]\n\n📌 Foco: ${currentTitle}\n\nConforme analisamos os parâmetros de fomento e sua fonte de conhecimento, simplificar fluxos e otimizar ações rápidas geram resultados de alto impacto. Baseado no tamanho ${sizeDesc}.\n\n💡 Insights Práticos para Implementação:\n• Remova ruídos e simplifique os canais de entrada corporativos.\n• Otimize presets com foco em autoatendimento e clareza vocal.\n\nQual a sua perspectiva econômica sobre essa pauta? Deixe sua contribuição abaixo!\n\n#SaaS #Produtividade #Liderança`;
        } else if (selectedSize === 'grande') {
          text = `💎 [[MOCK] ANÁLISE EXECUTIVA INDEPENDENTE - TOM: ${userTone.toUpperCase()}]\n\n🚀 Assunto: ${currentTitle}\n\nNo cenário de produção moderna e otimizada por IA, converter grandes volumes de informação primária em leituras envolventes é um dos principais diferenciais competitivos do mercado. Este ensaio detalha planos e ações tangíveis para aprimorar o seu ecossistema de conteúdo de forma exponencial.\n\n📚 FUNDAMENTOS DE CONTEXTO E FLUXO VOCAL\nLíderes de tecnologia buscam incansavelmente por escalabilidade sem perder a sensibilidade estilística corporativa. O maior segredo reside em desenhar uma consistência vocal centrada no tom "${userTone}", garantindo clareza e autoridade inequívocas.\n\n⚡ ROTEIRO DE DISPARO RÁPIDO EM 3 ETAPAS:\n\n1️⃣ DIAGNÓSTICO DE FORMATOS\nMapeie exaustivamente onde o público está consumindo seus ensaios mais elaborados. Tamanhos grandes (como esse de até 7000 caracteres) funcionam de forma exemplar em newsletters semanais.\n\n2️⃣ ENGENHARIA DE PRESET E PARÂMETROS LIVRES\nSubstitua dropdowns rígidos por caixas livres onde você pode descrever livremente as sutilezas da mensagem.\n\n3️⃣ OTIMIZAÇÃO DE METAS E KPI DE RETENÇÃO\nAjuste o fomento baseado em dados analíticos reais das suas plataformas corporativas de destino.\n\n📈 CONSIDERAÇÕES FINAIS E PRÓXIMOS PASSOS\nO seu potencial orgânico é exponencial se as ferramentas certas forem utilizadas. Invista em simplicidade operacional e colha resultados de retenção de alto nível.\n\nComo sua equipe lida com este gerenciamento vocal? Compartilhe e nos diga seu comentário!`;
        } else {
          text = `📢 [[MOCK] ARTIGO DIRECIONADO - TOM: ${userTone.toUpperCase()}]\n\nTema em Foco: ${currentTitle}\n\nNo panorama mercadológico de hoje, a construção de relevância está correlacionada com a adoção de um tom de voz "${userTone}" claro, sem rodeios e focado em dores reais do seu nicho de atuação.\n\nSeparamos 3 pilares recomendados para elevar seu alcance:\n\n1️⃣ FLUIDEZ NARRATIVA\nEscreva como fala. Ao estruturar os parágrafos, garanta que a leitura seja adaptada para escaneamento rápido no celular.\n\n2️⃣ DADOS E MÉTRICAS DE APOIO\nApresente ensinamentos empiricamente defensáveis. Isso constrói credibilidade indiscutível.\n\n3️⃣ CENTRALIZAÇÃO E FOCO\nMantenha todos os posts estruturados em um mesmo local para evitar a perda do tom.\n\nO que achou dessas ponderações estratégicas estruturadas pelo Pilot? Comente aqui embaixo! 👇\n\n#Inovação #Presets #Liderança`;
        }

        simulated.push({
          title: currentTitle,
          content: text
        });
      }

      res.json({ posts: simulated });
      return;
    }

    const ai = getAIClient();
    const sizeLimitText = selectedSize === 'pequeno'
      ? 'focado e curto, com no máximo 1000 caracteres'
      : (selectedSize === 'grande' ? 'exaustivo e longo, de 3500 até 7000 caracteres trazendo explicações profundas' : 'estilo intermediário, de 1500 até 3000 caracteres');

    const cleanTitle = title?.trim() ? `Título proposto: ${title.trim()}` : 'Tema livre definido a partir das fontes fornecidas.';
    const rawContext = sourceText?.trim() ? `Matéria-prima e notas do usuário para embasamento:\n"${sourceText.trim()}"` : 'Use conhecimentos gerais para desenvolver o rascunho de post.';

    const systemPrompt = `Você é o Redator de Elite do SaaS Pilot Content.
Sua missão é gerar um lote contendo exatamente ${numPosts} rascunhos de posts de alta conversão, calibrados conforme os comandos abaixo.

${cleanTitle}
Tom de voz exigido: "${userTone}"
Tamanho de conteúdo exigido: ${sizeLimitText}

${rawContext}

Gere exatamente ${numPosts} post(s) distintos ou complementares no mesmo lote.
A estrutura do array JSON deve seguir o formato especificado. Escreva estritamente em Português do Brasil.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: `Array com exatamente ${numPosts} posts gerados no tom selecionado.`,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Título ou gancho do rascunho de post gerações múltiplas.' },
              content: { type: Type.STRING, description: 'Conteúdo textual completo do post com parágrafos fluidos, emojis adequados, estruturação de parágrafos e CTAs.' }
            },
            required: ['title', 'content']
          }
        }
      }
    });

    const jsonText = response.text?.trim() || '[]';
    try {
      const posts = JSON.parse(jsonText);
      res.json({ posts });
    } catch {
      res.status(500).json({ error: 'Erro ao analisar JSON enviado pelo modelo.', raw: jsonText });
    }

  } catch (error: any) {
    console.error('Erro de geração no gerador simples:', error);
    res.status(500).json({ error: error?.message || 'Erro interno ao processar requisição de gravação simples.' });
  }
});

// Configure development or production workflows
const configureServer = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.VITE_PROD === 'true') {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Integrate Vite as Middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`[Pilot Server] Running at port: ${port}`);
  });
};

configureServer().catch((err) => {
  console.error('[Pilot Server] Failed to initiate:', err);
});
