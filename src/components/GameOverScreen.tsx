import React from 'react';
import { RotateCcw, Trophy, Award, Sparkles } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  coins: number;
  distance: number;
  onPlayAgain: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  coins,
  distance,
  onPlayAgain,
}) => {
  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 select-none animate-fadeIn">
      <div className="max-w-sm w-full bg-gradient-to-b from-amber-900 via-amber-950 to-stone-950 border-4 border-amber-500 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="mb-4">
          <div className="inline-block bg-amber-800/90 border border-amber-500/50 px-4 py-1 rounded-full text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            Ancient Temple Run
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md tracking-wide">
            ADVENTURE OVER!
          </h2>
        </div>

        {/* New High Score Celebratory Banner */}
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 text-amber-950 font-black px-4 py-1.5 rounded-2xl mb-4 flex items-center justify-center gap-1.5 shadow-lg animate-bounce text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>New High Score!</span>
            <Sparkles className="w-4 h-4 text-amber-900" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-amber-950/90 border-2 border-amber-600/50 rounded-2xl p-4 mb-5 shadow-inner flex flex-col gap-3">
          {/* Main Final Score */}
          <div className="flex flex-col items-center">
            <span className="text-amber-400 text-xs font-black uppercase tracking-wider">
              Final Score
            </span>
            <span className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="h-px bg-amber-800/60 w-full" />

          {/* Secondary stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Coins */}
            <div className="flex flex-col items-center bg-amber-900/40 p-2 rounded-xl border border-amber-700/30">
              <span className="text-yellow-400 text-[10px] font-black uppercase">Coins</span>
              <div className="flex items-center gap-1 text-white font-black text-lg">
                <span className="text-yellow-400 text-sm">★</span>
                <span>{coins}</span>
              </div>
            </div>

            {/* Distance */}
            <div className="flex flex-col items-center bg-amber-900/40 p-2 rounded-xl border border-amber-700/30">
              <span className="text-emerald-400 text-[10px] font-black uppercase">Distance</span>
              <span className="text-white font-black text-lg">{distance}m</span>
            </div>

            {/* High Score */}
            <div className="flex flex-col items-center bg-amber-900/40 p-2 rounded-xl border border-amber-700/30">
              <span className="text-amber-300 text-[10px] font-black uppercase">Best</span>
              <div className="flex items-center gap-1 text-amber-200 font-black text-lg">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>{highScore.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Big PLAY AGAIN Button */}
        <button
          onClick={onPlayAgain}
          className="w-full cursor-pointer py-4 bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 active:scale-95 transition-all duration-150 rounded-2xl border-3 border-green-200 shadow-[0_6px_0_#14532d,0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center gap-2 text-white text-2xl font-black tracking-wider uppercase"
        >
          <RotateCcw className="w-6 h-6 stroke-[3]" />
          <span>PLAY AGAIN</span>
        </button>
      </div>
    </div>
  );
};
