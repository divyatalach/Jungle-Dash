import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Music } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 select-none">
      <div className="max-w-xs w-full bg-gradient-to-b from-amber-900 to-amber-950 border-4 border-amber-500 rounded-3xl p-6 shadow-2xl text-center">
        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-wider">
          GAME PAUSED
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          {/* Resume Button */}
          <button
            onClick={onResume}
            className="w-full cursor-pointer py-3.5 bg-gradient-to-b from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 transition-transform rounded-2xl border-2 border-green-300 shadow-lg flex items-center justify-center gap-2 text-white font-black text-xl uppercase tracking-wider"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="w-full cursor-pointer py-3 bg-amber-800/80 hover:bg-amber-700/80 active:scale-95 transition-transform rounded-2xl border-2 border-amber-600 text-amber-200 font-extrabold text-base uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-amber-800/70">
          <button
            onClick={onToggleSound}
            className={`p-3 rounded-2xl border-2 flex items-center gap-2 font-bold text-xs uppercase cursor-pointer transition-colors ${
              soundEnabled
                ? 'bg-amber-800/70 border-amber-500 text-amber-200'
                : 'bg-stone-900/80 border-stone-700 text-stone-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>SFX</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`p-3 rounded-2xl border-2 flex items-center gap-2 font-bold text-xs uppercase cursor-pointer transition-colors ${
              musicEnabled
                ? 'bg-amber-800/70 border-amber-500 text-amber-200'
                : 'bg-stone-900/80 border-stone-700 text-stone-400'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Music</span>
          </button>
        </div>
      </div>
    </div>
  );
};
