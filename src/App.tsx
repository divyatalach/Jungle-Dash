/**
 * Jungle Dash - Main Application Entry
 * Full-screen responsive endless runner game
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState } from './types/game';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';
import { soundManager } from './audio/soundManager';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState({
    score: 0,
    coins: 0,
    speed: 340,
    distance: 0,
    hasShield: false,
    hasMagnet: false,
    shieldTimePct: 0,
    magnetTimePct: 0,
  });
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('jungledash_highscore');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [milestone, setMilestone] = useState<{ message: string; subtext: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Swipe detection refs
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Detect touch capability
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    engine.setCallbacks(
      (state) => {
        setGameState(state);
        if (state === 'GAMEOVER') {
          const currentHigh = parseInt(localStorage.getItem('jungledash_highscore') || '0', 10);
          setHighScore(currentHigh);
        }
      },
      (newStats) => {
        setStats(newStats);
      },
      (m) => {
        setMilestone(m);
        setTimeout(() => setMilestone(null), 2500);
      }
    );

    // Responsive Canvas Resizing
    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      engine.resize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (engine.state === 'PLAYING') {
          engine.pause();
        } else if (engine.state === 'PAUSED') {
          engine.resume();
        }
        return;
      }

      if (engine.state !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          engine.jump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          engine.slide();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Swipe Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !engineRef.current) return;
    const engine = engineRef.current;
    if (engine.state !== 'PLAYING') return;

    if (e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
      const minSwipeDistance = 25;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX < 0) {
            engine.moveLeft();
          } else {
            engine.moveRight();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY < 0) {
            engine.jump();
          } else {
            engine.slide();
          }
        }
      }
    }
    touchStartPos.current = null;
  };

  // Game control callbacks
  const handlePlay = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const handleToggleSound = useCallback(() => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundManager.setSoundEnabled(nextVal);
  }, [soundEnabled]);

  const handleToggleMusic = useCallback(() => {
    const nextVal = !musicEnabled;
    setMusicEnabled(nextVal);
    soundManager.setMusicEnabled(nextVal);
  }, [musicEnabled]);

  const handleMoveLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-amber-950 select-none flex items-center justify-center font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 2.5D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-emerald-950"
      />

      {/* In-Game HUD (Visible during gameplay & pause) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHUD
          score={stats.score}
          highScore={highScore}
          coins={stats.coins}
          speed={stats.speed}
          distance={stats.distance}
          hasShield={stats.hasShield}
          hasMagnet={stats.hasMagnet}
          shieldTimePct={stats.shieldTimePct}
          magnetTimePct={stats.magnetTimePct}
          milestone={milestone}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onPause={handlePause}
        />
      )}

      {/* On-screen touch buttons for mobile or tablet */}
      {isTouchDevice && gameState === 'PLAYING' && (
        <TouchControls
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onJump={handleJump}
          onSlide={handleSlide}
        />
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <StartScreen highScore={highScore} onPlay={handlePlay} />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <GameOverScreen
          score={stats.score}
          highScore={highScore}
          coins={stats.coins}
          distance={stats.distance}
          onPlayAgain={handleRestart}
        />
      )}
    </div>
  );
}
