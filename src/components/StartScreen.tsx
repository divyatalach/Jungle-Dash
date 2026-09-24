import React from 'react';
import { Play, Trophy, Sparkles, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface StartScreenProps {
  highScore: number;
  onPlay: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ highScore, onPlay }) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-400/30 via-amber-900/60 to-emerald-950/90 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 select-none">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        {/* Title Badge */}
        <div className="relative mb-4">
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-3xl blur-xl opacity-50 animate-pulse" />
          
          <div className="relative bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 p-5 rounded-3xl border-4 border-yellow-300 shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">🌴</span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wider drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                JUNGLE DASH
              </h1>
              <span className="text-3xl">🗿</span>
            </div>
            <p className="text-yellow-200 text-sm font-bold tracking-wide">
              ANCIENT TEMPLE RUNNER
            </p>
          </div>
        </div>

        {/* High Score Badge */}
        {highScore > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/80 border-2 border-amber-500/60 px-4 py-1.5 rounded-full text-amber-200 text-sm font-extrabold mb-5 shadow-lg">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Best Score: <strong className="text-yellow-300">{highScore.toLocaleString()}</strong></span>
          </div>
        )}

        {/* Big Juicy PLAY Button */}
        <button
          onClick={onPlay}
          className="group relative cursor-pointer px-10 py-5 bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 active:scale-95 transition-all duration-150 rounded-3xl border-4 border-green-200 shadow-[0_8px_0_#14532d,0_15px_25px_rgba(0,0,0,0.4)] flex items-center justify-center gap-3 text-white text-3xl font-black tracking-wider uppercase mb-7"
        >
          <Play className="w-8 h-8 fill-white transition-transform group-hover:scale-110" />
          <span>PLAY</span>
          <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" />
        </button>

        {/* Simple Visual Controls Card (Child-Friendly) */}
        <div className="bg-amber-950/85 border-2 border-amber-500/60 rounded-2xl p-4 w-full shadow-xl">
          <h3 className="text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
            Quick & Easy Controls
          </h3>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Lane Switching */}
            <div className="bg-amber-900/60 border border-amber-600/40 p-2.5 rounded-xl flex flex-col items-center">
              <div className="flex items-center gap-1 text-amber-300 mb-1">
                <ArrowLeft className="w-5 h-5 bg-amber-800 p-0.5 rounded" />
                <ArrowRight className="w-5 h-5 bg-amber-800 p-0.5 rounded" />
              </div>
              <span className="text-white text-xs font-black">Switch Lanes</span>
              <span className="text-amber-200 text-[10px]">Left / Right</span>
            </div>

            {/* Jump */}
            <div className="bg-amber-900/60 border border-amber-600/40 p-2.5 rounded-xl flex flex-col items-center">
              <div className="text-sky-300 mb-1">
                <ArrowUp className="w-5 h-5 bg-sky-800 p-0.5 rounded mx-auto" />
              </div>
              <span className="text-white text-xs font-black">Jump</span>
              <span className="text-sky-200 text-[10px]">Up / Space</span>
            </div>

            {/* Slide */}
            <div className="bg-amber-900/60 border border-amber-600/40 p-2.5 rounded-xl flex flex-col items-center">
              <div className="text-yellow-300 mb-1">
                <ArrowDown className="w-5 h-5 bg-amber-800 p-0.5 rounded mx-auto" />
              </div>
              <span className="text-white text-xs font-black">Slide</span>
              <span className="text-yellow-200 text-[10px]">Down Arrow</span>
            </div>
          </div>

          <p className="text-amber-300/80 text-[11px] font-bold mt-2.5">
            📱 On phone / tablet: Swipe or tap screen buttons!
          </p>
        </div>
      </div>
    </div>
  );
};
