import React from 'react';
import { Pause, Volume2, VolumeX, Shield, Magnet, Trophy } from 'lucide-react';

interface GameHUDProps {
  score: number;
  highScore: number;
  coins: number;
  speed: number;
  distance: number;
  hasShield: boolean;
  hasMagnet: boolean;
  shieldTimePct: number;
  magnetTimePct: number;
  milestone: { message: string; subtext: string } | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  coins,
  speed,
  distance,
  hasShield,
  hasMagnet,
  shieldTimePct,
  magnetTimePct,
  milestone,
  soundEnabled,
  onToggleSound,
  onPause,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left Side: Score & Distance */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Main Score Pill */}
          <div className="flex items-center gap-2 bg-amber-950/85 backdrop-blur-md border-2 border-amber-500/70 px-4 py-1.5 rounded-2xl shadow-lg">
            <span className="text-amber-300 text-xs font-black tracking-wider uppercase">Score</span>
            <span className="text-white text-2xl sm:text-3xl font-black tracking-tight tabular-nums drop-shadow-md">
              {score.toLocaleString()}
            </span>
          </div>

          {/* High Score & Distance */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-950/70 border border-amber-600/50 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-200 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Best: {Math.max(highScore, score).toLocaleString()}</span>
            </div>
            <div className="bg-amber-950/70 border border-amber-600/50 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-300 shadow-sm">
              <span>{distance}m</span>
            </div>
          </div>
        </div>

        {/* Center: Milestone Toast Notification */}
        {milestone && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-none animate-banner-bounce z-30">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 px-6 py-2 rounded-2xl shadow-2xl border-4 border-yellow-200 text-center">
              <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider drop-shadow-sm">
                {milestone.message}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-900 mt-0.5">
                {milestone.subtext}
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Coins & Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coins Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 border-2 border-yellow-200 text-amber-950 px-3.5 py-1.5 rounded-2xl shadow-lg font-black text-xl sm:text-2xl tabular-nums">
            <div className="w-6 h-6 rounded-full bg-yellow-300 border-2 border-yellow-500 flex items-center justify-center shadow-inner animate-coin-sparkle">
              <span className="text-amber-900 text-xs font-black">★</span>
            </div>
            <span>{coins}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="w-11 h-11 rounded-2xl bg-amber-950/85 hover:bg-amber-900/90 border-2 border-amber-500/70 text-amber-200 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-300" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="w-11 h-11 rounded-2xl bg-amber-950/85 hover:bg-amber-900/90 border-2 border-amber-500/70 text-amber-200 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Pause className="w-5 h-5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Active Power-Ups (Left edge indicators) */}
      <div className="flex flex-col gap-2 pointer-events-none mb-12 sm:mb-6">
        {hasShield && (
          <div className="flex items-center gap-2 bg-emerald-950/85 border-2 border-emerald-400 px-3 py-1.5 rounded-xl shadow-lg w-fit">
            <Shield className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-emerald-200">Shield Active</span>
              <div className="w-20 bg-emerald-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, shieldTimePct * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {hasMagnet && (
          <div className="flex items-center gap-2 bg-sky-950/85 border-2 border-sky-400 px-3 py-1.5 rounded-xl shadow-lg w-fit">
            <Magnet className="w-5 h-5 text-sky-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-sky-200">Coin Magnet</span>
              <div className="w-20 bg-sky-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-400 h-full transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, magnetTimePct * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
