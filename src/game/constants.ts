/**
 * Jungle Dash - Game Constants
 */
import { Milestone } from '../types/game';

export const GAME_CONSTANTS = {
  // Road & Perspective
  ROAD_WIDTH: 360,
  LANE_OFFSET: 110, // Horizontal offset per lane (-1, 0, 1)
  VIEW_DISTANCE: 1800, // Z distance to spawn and render
  CAMERA_Z: -180, // Camera distance behind player
  CAMERA_HEIGHT: 180, // Height of camera above ground
  HORIZON_RATIO: 0.42, // Horizon line percentage from top of screen

  // Speeds
  INITIAL_SPEED: 340, // Base forward scroll speed
  MAX_SPEED: 820,     // Top speed
  SPEED_ACCEL: 4.5,   // Speed increase per second
  LANE_CHANGE_SPEED: 14, // Lerp speed for switching lanes

  // Jump & Slide Physics
  JUMP_VELOCITY: 520, // Initial upward velocity
  GRAVITY: 1450,      // Downward acceleration
  SLIDE_DURATION: 0.75, // Seconds of slide duration

  // Collision Margins (in world Z units)
  PLAYER_Z: 0,
  HIT_MARGIN_Z: 32,
  HIT_MARGIN_X: 45,

  // Spawning
  MIN_OBSTACLE_GAP: 220,
  MAX_OBSTACLE_GAP: 380,

  // Power-up durations
  MAGNET_DURATION: 8, // seconds
  SHIELD_DURATION: 12, // seconds
};

export const MILESTONES: Milestone[] = [
  { score: 300, message: "Great!", subtext: "Finding your rhythm!", achieved: false },
  { score: 800, message: "Awesome!", subtext: "Jungle Explorer!", achieved: false },
  { score: 1500, message: "Amazing!", subtext: "Ancient Temple Runner!", achieved: false },
  { score: 2500, message: "You're Fast!", subtext: "Blazing through the vines!", achieved: false },
  { score: 4000, message: "Super Sonic!", subtext: "Unstoppable adventurer!", achieved: false },
  { score: 6000, message: "Jungle Legend!", subtext: "Golden Idol Master!", achieved: false },
  { score: 10000, message: "Mythical Runner!", subtext: "Ancient Gods salute you!", achieved: false },
];
