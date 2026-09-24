/**
 * Jungle Dash - Game Types
 */

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type Lane = -1 | 0 | 1; // -1: Left, 0: Center, 1: Right

export enum ObstacleType {
  FALLEN_TREE = 'FALLEN_TREE',     // Low log - Jump over
  LARGE_ROCK = 'LARGE_ROCK',       // Boulder - Switch lanes
  BROKEN_BRIDGE = 'BROKEN_BRIDGE', // Pit / Chasm - Jump over
  WOODEN_BARRIER = 'WOODEN_BARRIER', // High temple beam - Slide under
  FIRE_OBSTACLE = 'FIRE_OBSTACLE', // Ancient fire brazier - Switch lanes or jump
}

export enum PowerUpType {
  MAGNET = 'MAGNET', // Attracts coins
  SHIELD = 'SHIELD', // Protects against 1 hit
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  lane: Lane;
  z: number; // Distance ahead of camera/player
  width: number;
  height: number;
  cleared?: boolean;
}

export interface Coin {
  id: string;
  lane: Lane;
  z: number;
  y: number; // Height above ground (for jump arcs)
  collected: boolean;
  angle: number; // For 3D spin animation
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  lane: Lane;
  z: number;
  y: number;
  collected: boolean;
  angle: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
  shape?: 'circle' | 'star' | 'leaf' | 'smoke' | 'spark';
}

export interface SceneryItem {
  id: string;
  side: -1 | 1; // -1: Left of road, 1: Right of road
  z: number;
  type: 'PALM_TREE' | 'TEMPLE_PILLAR' | 'STONE_STATUE' | 'TORCH' | 'JUNGLE_BUSH' | 'TEMPLE_ARCH';
  variant: number;
}

export interface Milestone {
  score: number;
  message: string;
  subtext: string;
  achieved: boolean;
}
