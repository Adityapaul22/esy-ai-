import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 1800,
}) => {
  const [phase, setPhase] = useState<'entering' | 'loading' | 'exiting'>('entering');
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing Esy AI...');

  useEffect(() => {
    // Step progress
    const t1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Connecting to Gemini Intelligence...');
      setPhase('loading');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(90);
      setStatusText('Preparing workspace...');
    }, 1100);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready');
      setPhase('exiting');
    }, minDurationMs);

    const t4 = setTimeout(() => {
      onFinish();
    }, minDurationMs + 400); // 400ms fade-out transition

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [minDurationMs, onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-500 cursor-pointer select-none overflow-hidden ${
        phase === 'exiting' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient radial glow matching logo colors */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-purple-600/30 blur-[130px] rounded-full pointer-events-none animate-pulse" />

      {/* Decorative subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Logo Card with multi-layer shadow and glow */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-3xl blur-lg opacity-60 group-hover:opacity-90 animate-tilt transition duration-1000" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-3 shadow-2xl flex items-center justify-center transform transition-transform duration-500 hover:scale-105">
            <img
              src="/logo.png"
              alt="Esy AI Logo"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Esy AI
            </h1>
            <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Intelligent • Multimodal • Real-time
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 sm:w-56 space-y-2 pt-2">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate">{statusText}</span>
            <span className="font-mono text-slate-400 shrink-0">{progress}%</span>
          </div>
        </div>

        {/* Tap to skip hint */}
        <div className="pt-4 text-[10px] text-slate-400 tracking-wider uppercase">
          Tap anywhere to skip
        </div>
      </div>
    </div>
  );
};
