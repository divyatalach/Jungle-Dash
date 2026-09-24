import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-3 px-4 flex items-end justify-between pointer-events-none select-none z-30 pb-safe">
      {/* Left/Right Steering Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onMoveLeft();
          }}
          onClick={onMoveLeft}
          aria-label="Move Left"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-950/75 active:bg-amber-700/90 border-3 border-amber-400/80 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer backdrop-blur-sm"
        >
          <ArrowLeft className="w-8 h-8 stroke-[3]" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onMoveRight();
          }}
          onClick={onMoveRight}
          aria-label="Move Right"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-950/75 active:bg-amber-700/90 border-3 border-amber-400/80 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer backdrop-blur-sm"
        >
          <ArrowRight className="w-8 h-8 stroke-[3]" />
        </button>
      </div>

      {/* Jump & Slide Action Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onSlide();
          }}
          onClick={onSlide}
          aria-label="Slide"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-950/75 active:bg-amber-700/90 border-3 border-yellow-400/80 text-yellow-300 flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer backdrop-blur-sm"
        >
          <ArrowDown className="w-6 h-6 stroke-[3]" />
          <span className="text-[10px] font-black uppercase mt-0.5">SLIDE</span>
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onJump();
          }}
          onClick={onJump}
          aria-label="Jump"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-950/75 active:bg-emerald-600/90 border-3 border-emerald-400/90 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer backdrop-blur-sm"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[10px] font-black uppercase mt-0.5">JUMP</span>
        </button>
      </div>
    </div>
  );
};
