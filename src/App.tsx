import React, { useState, useEffect } from 'react';
import { AppState, NovelAnalysis, VisualIdentity } from './types';
import { UploadPage } from './components/UploadPage';
import { Dashboard } from './components/Dashboard';
import { IdentityGenerator } from './components/IdentityGenerator';
import { analyzeNovel, generateCoverImage } from './services/geminiService';
import { EXAMPLE_NOVEL } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Palette, Upload, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>('dashboard');
  const [analysis, setAnalysis] = useState<NovelAnalysis | null>(EXAMPLE_NOVEL);
  const [identity, setIdentity] = useState<VisualIdentity | null>({
    colorPalette: EXAMPLE_NOVEL.emotions.map(e => e.color),
    typography: {
      primary: 'Amiri',
      secondary: 'IBM Plex Sans Arabic'
    },
    symbols: EXAMPLE_NOVEL.symbols.map(s => ({ icon: s.symbol, label: s.concept })),
    coverPrompt: `Book cover for ${EXAMPLE_NOVEL.title}`
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate cover image for the preloaded example in the background
    const loadExampleCover = async () => {
      try {
        const coverUrl = await generateCoverImage(EXAMPLE_NOVEL);
        setIdentity(prev => prev ? { ...prev, coverImage: coverUrl } : null);
      } catch (e) {
        console.error("Failed to load example cover", e);
      }
    };
    loadExampleCover();
  }, []);

  const handleAnalyze = async (text: string) => {
    setLoading(true);
    setState('analyzing');
    try {
      const result = await analyzeNovel(text);
      setAnalysis(result);
      
      // Generate initial identity based on analysis
      const initialIdentity: VisualIdentity = {
        colorPalette: result.emotions.map(e => e.color),
        typography: {
          primary: 'Amiri',
          secondary: 'IBM Plex Sans Arabic'
        },
        symbols: result.symbols.map(s => ({ icon: s.symbol, label: s.concept })),
        coverPrompt: `Book cover for ${result.title}`
      };
      setIdentity(initialIdentity);
      setState('dashboard');
      
      // Generate cover image in background
      const coverUrl = await generateCoverImage(result);
      setIdentity(prev => prev ? { ...prev, coverImage: coverUrl } : null);
    } catch (error) {
      console.error("Analysis failed:", error);
      setState('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleTryExample = async () => {
    setAnalysis(EXAMPLE_NOVEL);
    const initialIdentity: VisualIdentity = {
      colorPalette: EXAMPLE_NOVEL.emotions.map(e => e.color),
      typography: {
        primary: 'Amiri',
        secondary: 'IBM Plex Sans Arabic'
      },
      symbols: EXAMPLE_NOVEL.symbols.map(s => ({ icon: s.symbol, label: s.concept })),
      coverPrompt: `Book cover for ${EXAMPLE_NOVEL.title}`
    };
    setIdentity(initialIdentity);
    setState('dashboard');
    
    // Generate cover in background
    try {
      const coverUrl = await generateCoverImage(EXAMPLE_NOVEL);
      setIdentity(prev => prev ? { ...prev, coverImage: coverUrl } : null);
    } catch (e) {
      console.error("Failed to load example cover", e);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Navigation */}
      {state !== 'upload' && state !== 'analyzing' && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-navy/5 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setState('upload')}>
              <Sparkles className="w-6 h-6 text-gold" />
              <span className="text-xl font-serif font-bold text-navy">عتبات AI</span>
            </div>
            <div className="flex bg-navy/5 p-1 rounded-full">
              <button 
                onClick={() => setState('dashboard')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  state === 'dashboard' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> لوحة التحليل
              </button>
              <button 
                onClick={() => setState('identity')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  state === 'identity' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'
                }`}
              >
                <Palette className="w-4 h-4" /> الهوية البصرية
              </button>
            </div>
            <button 
              onClick={() => setState('upload')}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-full text-sm font-medium hover:bg-navy/80 transition-colors"
            >
              <Upload className="w-4 h-4" /> تحليل رواية جديدة
            </button>
          </div>
        </nav>
      )}

      <main>
        <AnimatePresence mode="wait">
          {state === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UploadPage onAnalyze={handleAnalyze} onTryExample={handleTryExample} />
            </motion.div>
          )}

          {state === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-gold animate-spin" />
                <Sparkles className="w-6 h-6 text-navy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-3xl font-serif mt-8 mb-4">جاري تحليل الرواية...</h2>
              <p className="text-navy/60 max-w-md">
                نقوم الآن باستخلاص الثيمات، الشخصيات، والرموز الأدبية لبناء هوية بصرية فريدة.
              </p>
              <div className="mt-12 w-64 h-1 bg-navy/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gold"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}

          {state === 'dashboard' && analysis && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard analysis={analysis} onNewAnalysis={() => setState('upload')} />
            </motion.div>
          )}

          {state === 'identity' && analysis && identity && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IdentityGenerator analysis={analysis} identity={identity} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-navy/5 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-navy/40 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-serif font-bold">عتبات AI</span>
          </div>
          <p>© 2024 مختبر الإنسانيات الرقمية. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-navy transition-colors">عن المشروع</a>
            <a href="#" className="hover:text-navy transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-navy transition-colors">تواصل معنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
