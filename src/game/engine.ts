/**
 * Jungle Dash - Core Game Engine
 * Manages game state, physics, procedural generation, collisions, and scoring
 */
import { soundManager } from '../audio/soundManager';
import { Coin, GameState, Milestone, Obstacle, ObstacleType, Particle, PowerUpItem, PowerUpType, SceneryItem } from '../types/game';
import { GAME_CONSTANTS, MILESTONES } from './constants';
import { GameRenderer } from './renderer';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;

  // Game Loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  public state: GameState = 'START';

  // Player State
  public targetLane: -1 | 0 | 1 = 0;
  public playerX: number = 0; // -1 to 1 interpolated
  public playerY: number = 0; // vertical jump height
  public playerVy: number = 0;
  public isJumping: boolean = false;
  public isSliding: boolean = false;
  public slideTimer: number = 0;
  public runCycle: number = 0;

  // Power-Ups
  public hasShield: boolean = false;
  public shieldTimer: number = 0;
  public hasMagnet: boolean = false;
  public magnetTimer: number = 0;
  public invulnerableTimer: number = 0;

  // Metrics
  public score: number = 0;
  public highScore: number = 0;
  public coinsCount: number = 0;
  public distance: number = 0;
  public gameSpeed: number = GAME_CONSTANTS.INITIAL_SPEED;
  private roadOffset: number = 0;

  // Entities
  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];
  private powerUps: PowerUpItem[] = [];
  private scenery: SceneryItem[] = [];
  private particles: Particle[] = [];

  // Spawners
  private nextObstacleZ: number = 500;
  private nextSceneryZ: number = 80;
  private idCounter: number = 0;

  // Milestones
  private milestones: Milestone[] = [];
  public currentMilestoneToast: { message: string; subtext: string } | null = null;
  private toastTimer: number = 0;

  // Callbacks for UI updates
  private onStateChange?: (state: GameState) => void;
  private onStatsUpdate?: (stats: {
    score: number;
    coins: number;
    speed: number;
    distance: number;
    hasShield: boolean;
    hasMagnet: boolean;
    shieldTimePct: number;
    magnetTimePct: number;
  }) => void;
  private onMilestone?: (milestone: { message: string; subtext: string }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.renderer = new GameRenderer(ctx);

    // Load high score
    const savedHighScore = localStorage.getItem('jungledash_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    this.resetGame();
  }

  public setCallbacks(
    onStateChange: (state: GameState) => void,
    onStatsUpdate: (stats: {
      score: number;
      coins: number;
      speed: number;
      distance: number;
      hasShield: boolean;
      hasMagnet: boolean;
      shieldTimePct: number;
      magnetTimePct: number;
    }) => void,
    onMilestone: (milestone: { message: string; subtext: string }) => void
  ) {
    this.onStateChange = onStateChange;
    this.onStatsUpdate = onStatsUpdate;
    this.onMilestone = onMilestone;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.resize(width, height);
  }

  // -------------------------------------------------------------
  // GAME LIFECYCLE
  // -------------------------------------------------------------
  public start() {
    this.resetGame();
    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    soundManager.startMusic();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.onStateChange?.(this.state);
    soundManager.stopMusic();
  }

  public resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    soundManager.startMusic();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public restart() {
    this.start();
  }

  private resetGame() {
    this.targetLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.runCycle = 0;

    this.hasShield = false;
    this.shieldTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.invulnerableTimer = 0;

    this.score = 0;
    this.coinsCount = 0;
    this.distance = 0;
    this.gameSpeed = GAME_CONSTANTS.INITIAL_SPEED;
    this.roadOffset = 0;

    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.scenery = [];
    this.particles = [];

    this.nextObstacleZ = 550;
    this.nextSceneryZ = 50;

    // Reset milestones
    this.milestones = MILESTONES.map((m) => ({ ...m, achieved: false }));
    this.currentMilestoneToast = null;
    this.toastTimer = 0;

    // Prepopulate scenery along the path
    this.populateInitialScenery();
  }

  private populateInitialScenery() {
    for (let z = 50; z < GAME_CONSTANTS.VIEW_DISTANCE + 200; z += 120) {
      this.spawnSceneryPair(z);
    }
  }

  // -------------------------------------------------------------
  // CONTROLS & INPUT
  // -------------------------------------------------------------
  public moveLeft() {
    if (this.state !== 'PLAYING') return;
    if (this.targetLane > -1) {
      this.targetLane = (this.targetLane - 1) as -1 | 0 | 1;
      soundManager.playLaneSwitch();
    }
  }

  public moveRight() {
    if (this.state !== 'PLAYING') return;
    if (this.targetLane < 1) {
      this.targetLane = (this.targetLane + 1) as -1 | 0 | 1;
      soundManager.playLaneSwitch();
    }
  }

  public jump() {
    if (this.state !== 'PLAYING') return;
    if (!this.isJumping && this.playerY <= 5) {
      this.isJumping = true;
      this.playerVy = GAME_CONSTANTS.JUMP_VELOCITY;
      this.isSliding = false;
      this.slideTimer = 0;
      soundManager.playJump();
      this.createJumpDustParticles();
    }
  }

  public slide() {
    if (this.state !== 'PLAYING') return;
    this.isSliding = true;
    this.slideTimer = GAME_CONSTANTS.SLIDE_DURATION;
    // If mid-air, fast dive to ground
    if (this.isJumping) {
      this.playerVy = -500;
    }
    soundManager.playSlide();
  }

  // -------------------------------------------------------------
  // MAIN TICK / LOOP
  // -------------------------------------------------------------
  private loop = (time: number) => {
    if (this.state !== 'PLAYING') return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.render(dt);

    if (this.state === 'PLAYING') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  private update(dt: number) {
    // 1. Accelerate game speed smoothly over time
    if (this.gameSpeed < GAME_CONSTANTS.MAX_SPEED) {
      this.gameSpeed += GAME_CONSTANTS.SPEED_ACCEL * dt;
    }

    // 2. Advance road offset & distance
    const forwardStep = this.gameSpeed * dt;
    this.roadOffset += forwardStep;
    this.distance += forwardStep * 0.05;
    this.score += Math.floor(forwardStep * 0.12);

    // Check high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('jungledash_highscore', this.highScore.toString());
    }

    // 3. Player horizontal lane lerp
    this.playerX += (this.targetLane - this.playerX) * Math.min(1, GAME_CONSTANTS.LANE_CHANGE_SPEED * dt);

    // 4. Player Jump physics
    if (this.isJumping) {
      this.playerY += this.playerVy * dt;
      this.playerVy -= GAME_CONSTANTS.GRAVITY * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isJumping = false;
        this.createJumpDustParticles();
      }
    }

    // 5. Player Slide countdown
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 6. Running cycle animation ticker
    this.runCycle += dt * (this.gameSpeed / 40);

    // 7. Power-up timers
    if (this.hasShield) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
      }
    }

    if (this.hasMagnet) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) {
        this.hasMagnet = false;
      }
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // 8. Move entities forward (towards player z=0)
    this.updateObstacles(forwardStep);
    this.updateCoins(forwardStep, dt);
    this.updatePowerUps(forwardStep, dt);
    this.updateScenery(forwardStep);
    this.updateParticles(dt);

    // 9. Procedural spawns
    this.generateEnvironment();

    // 10. Check Collisions
    this.checkCollisions();

    // 11. Check Milestones
    this.checkMilestones(dt);

    // 12. Send stats to HUD
    this.onStatsUpdate?.({
      score: this.score,
      coins: this.coinsCount,
      speed: Math.round(this.gameSpeed),
      distance: Math.round(this.distance),
      hasShield: this.hasShield,
      hasMagnet: this.hasMagnet,
      shieldTimePct: this.hasShield ? this.shieldTimer / GAME_CONSTANTS.SHIELD_DURATION : 0,
      magnetTimePct: this.hasMagnet ? this.magnetTimer / GAME_CONSTANTS.MAGNET_DURATION : 0,
    });
  }

  // -------------------------------------------------------------
  // PROCEDURAL GENERATION
  // -------------------------------------------------------------
  private generateEnvironment() {
    // 1. Scenery along road edges
    const maxSceneryZ = this.scenery.length > 0 ? Math.max(...this.scenery.map((s) => s.z)) : 0;
    if (maxSceneryZ < GAME_CONSTANTS.VIEW_DISTANCE + 100) {
      this.spawnSceneryPair(maxSceneryZ + 110 + Math.random() * 50);
    }

    // 2. Obstacles & Coin trails
    const maxObstacleZ = this.obstacles.length > 0 ? Math.max(...this.obstacles.map((o) => o.z)) : 0;
    if (maxObstacleZ < GAME_CONSTANTS.VIEW_DISTANCE) {
      const spawnZ = Math.max(GAME_CONSTANTS.VIEW_DISTANCE, maxObstacleZ + this.getObstacleGap());
      this.spawnObstaclePattern(spawnZ);
    }
  }

  private getObstacleGap(): number {
    // Speed-based gap scaling for fair child-friendly reaction window
    const speedRatio = (this.gameSpeed - GAME_CONSTANTS.INITIAL_SPEED) / (GAME_CONSTANTS.MAX_SPEED - GAME_CONSTANTS.INITIAL_SPEED);
    return GAME_CONSTANTS.MAX_OBSTACLE_GAP - speedRatio * (GAME_CONSTANTS.MAX_OBSTACLE_GAP - GAME_CONSTANTS.MIN_OBSTACLE_GAP);
  }

  private spawnObstaclePattern(z: number) {
    const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
    const types: ObstacleType[] = [
      ObstacleType.FALLEN_TREE,
      ObstacleType.LARGE_ROCK,
      ObstacleType.BROKEN_BRIDGE,
      ObstacleType.WOODEN_BARRIER,
      ObstacleType.FIRE_OBSTACLE,
    ];

    // Pick 1 or 2 lanes to place obstacles (CRITICAL: NEVER block all 3 lanes!)
    const isDoubleObstacle = Math.random() < 0.28 && this.gameSpeed > 460;
    const primaryLane = lanes[Math.floor(Math.random() * lanes.length)];
    const primaryType = types[Math.floor(Math.random() * types.length)];

    this.obstacles.push({
      id: `obs_${++this.idCounter}`,
      type: primaryType,
      lane: primaryLane,
      z,
      width: 80,
      height: 60,
    });

    // Spawn coin trail associated with obstacle
    this.spawnCoinsForObstacle(primaryType, primaryLane, z);

    if (isDoubleObstacle) {
      const remainingLanes = lanes.filter((l) => l !== primaryLane);
      const secondLane = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
      // Choose second type that is compatible
      let secondType = types[Math.floor(Math.random() * types.length)];
      // Avoid making it impossible to pass
      if (primaryType === ObstacleType.LARGE_ROCK && secondType === ObstacleType.LARGE_ROCK) {
        secondType = ObstacleType.FALLEN_TREE;
      }

      this.obstacles.push({
        id: `obs_${++this.idCounter}`,
        type: secondType,
        lane: secondLane,
        z,
        width: 80,
        height: 60,
      });
    }

    // Rare Power-Up Spawn (10% chance)
    if (Math.random() < 0.1) {
      const freeLanes = lanes.filter((l) => l !== primaryLane);
      const powerLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      this.powerUps.push({
        id: `pow_${++this.idCounter}`,
        type: Math.random() < 0.5 ? PowerUpType.MAGNET : PowerUpType.SHIELD,
        lane: powerLane,
        z: z + 120,
        y: 25,
        collected: false,
        angle: 0,
      });
    }
  }

  private spawnCoinsForObstacle(type: ObstacleType, obstacleLane: (-1 | 0 | 1), z: number) {
    if (type === ObstacleType.FALLEN_TREE || type === ObstacleType.BROKEN_BRIDGE) {
      // Coin JUMP ARC over the obstacle! Inspires jumping!
      const count = 5;
      for (let i = 0; i < count; i++) {
        const coinZ = z - 60 + i * 30;
        const progress = i / (count - 1);
        const arcY = Math.sin(progress * Math.PI) * 75 + 15;
        this.coins.push({
          id: `coin_${++this.idCounter}`,
          lane: obstacleLane,
          z: coinZ,
          y: arcY,
          collected: false,
          angle: Math.random() * Math.PI * 2,
        });
      }
    } else if (type === ObstacleType.WOODEN_BARRIER) {
      // Low coin trail on the floor to encourage sliding!
      for (let i = 0; i < 4; i++) {
        this.coins.push({
          id: `coin_${++this.idCounter}`,
          lane: obstacleLane,
          z: z - 45 + i * 30,
          y: 8,
          collected: false,
          angle: Math.random() * Math.PI * 2,
        });
      }
    } else {
      // For rocks/fire: rewarding coin line in an open neighboring lane!
      const otherLanes: (-1 | 0 | 1)[] = ([-1, 0, 1] as (-1 | 0 | 1)[]).filter((l) => l !== obstacleLane);
      const safeLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      for (let i = 0; i < 5; i++) {
        this.coins.push({
          id: `coin_${++this.idCounter}`,
          lane: safeLane,
          z: z - 50 + i * 30,
          y: 20,
          collected: false,
          angle: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  private spawnSceneryPair(z: number) {
    const sceneryTypes: SceneryItem['type'][] = ['PALM_TREE', 'TEMPLE_PILLAR', 'STONE_STATUE', 'TORCH', 'PALM_TREE'];

    // Left side
    const leftType = sceneryTypes[Math.floor(Math.random() * sceneryTypes.length)];
    this.scenery.push({
      id: `scen_${++this.idCounter}`,
      side: -1,
      z,
      type: leftType,
      variant: Math.random(),
    });

    // Right side
    const rightType = sceneryTypes[Math.floor(Math.random() * sceneryTypes.length)];
    this.scenery.push({
      id: `scen_${++this.idCounter}`,
      side: 1,
      z: z + (Math.random() - 0.5) * 40,
      type: rightType,
      variant: Math.random(),
    });

    // Occasional Grand Temple Arch spanning road (every ~900 units)
    if (Math.random() < 0.15 && z > 600) {
      this.scenery.push({
        id: `arch_${++this.idCounter}`,
        side: 1,
        z: z + 80,
        type: 'TEMPLE_ARCH',
        variant: 1,
      });
    }
  }

  // -------------------------------------------------------------
  // UPDATERS
  // -------------------------------------------------------------
  private updateObstacles(forwardStep: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= forwardStep;
      if (obs.z < -80) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateCoins(forwardStep: number, dt: number) {
    const playerWorldX = this.playerX * GAME_CONSTANTS.LANE_OFFSET;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.z -= forwardStep;
      coin.angle += dt * 5;

      // Magnet attraction
      if (this.hasMagnet && !coin.collected && coin.z > 0 && coin.z < 450) {
        const coinWorldX = coin.lane * GAME_CONSTANTS.LANE_OFFSET;
        const dx = playerWorldX - coinWorldX;
        if (Math.abs(dx) > 5) {
          // Attract coin horizontally towards player
          if (dx > 0) coin.lane = Math.min(1, coin.lane + 0.08) as -1 | 0 | 1;
          else coin.lane = Math.max(-1, coin.lane - 0.08) as -1 | 0 | 1;
        }
      }

      // Coin collection check
      if (!coin.collected && Math.abs(coin.z - GAME_CONSTANTS.PLAYER_Z) < 36) {
        const coinWorldX = coin.lane * GAME_CONSTANTS.LANE_OFFSET;
        const distX = Math.abs(playerWorldX - coinWorldX);
        const distY = Math.abs(this.playerY - coin.y);

        if (distX < GAME_CONSTANTS.HIT_MARGIN_X && distY < 65) {
          coin.collected = true;
          this.coinsCount++;
          this.score += 25;
          soundManager.playCoin();
          this.createCoinSparkleParticles(coin.lane, coin.y);
        }
      }

      if (coin.z < -80 || coin.collected) {
        this.coins.splice(i, 1);
      }
    }
  }

  private updatePowerUps(forwardStep: number, dt: number) {
    const playerWorldX = this.playerX * GAME_CONSTANTS.LANE_OFFSET;

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pow = this.powerUps[i];
      pow.z -= forwardStep;
      pow.angle += dt * 4;

      if (!pow.collected && Math.abs(pow.z - GAME_CONSTANTS.PLAYER_Z) < 36) {
        const powWorldX = pow.lane * GAME_CONSTANTS.LANE_OFFSET;
        const distX = Math.abs(playerWorldX - powWorldX);

        if (distX < GAME_CONSTANTS.HIT_MARGIN_X) {
          pow.collected = true;
          soundManager.playPowerUp();

          if (pow.type === PowerUpType.MAGNET) {
            this.hasMagnet = true;
            this.magnetTimer = GAME_CONSTANTS.MAGNET_DURATION;
          } else {
            this.hasShield = true;
            this.shieldTimer = GAME_CONSTANTS.SHIELD_DURATION;
          }
          this.createPowerUpSparkleParticles(pow.lane, pow.y, pow.type);
        }
      }

      if (pow.z < -80 || pow.collected) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private updateScenery(forwardStep: number) {
    for (let i = this.scenery.length - 1; i >= 0; i--) {
      const item = this.scenery[i];
      item.z -= forwardStep;
      if (item.z < -100) {
        this.scenery.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------
  // COLLISION DETECTION
  // -------------------------------------------------------------
  private checkCollisions() {
    if (this.invulnerableTimer > 0) return;

    const playerWorldX = this.playerX * GAME_CONSTANTS.LANE_OFFSET;

    for (const obs of this.obstacles) {
      if (obs.cleared) continue;

      // Z distance check
      const dz = Math.abs(obs.z - GAME_CONSTANTS.PLAYER_Z);
      if (dz < GAME_CONSTANTS.HIT_MARGIN_Z) {
        const obsWorldX = obs.lane * GAME_CONSTANTS.LANE_OFFSET;
        const dx = Math.abs(playerWorldX - obsWorldX);

        // Check if player is on the same lane
        if (dx < GAME_CONSTANTS.HIT_MARGIN_X) {
          let hit = false;

          switch (obs.type) {
            case ObstacleType.FALLEN_TREE:
              // Safe if player jumped high enough
              if (this.playerY < 32) hit = true;
              break;

            case ObstacleType.LARGE_ROCK:
              // Cannot jump over rock!
              hit = true;
              break;

            case ObstacleType.BROKEN_BRIDGE:
              // Safe if in mid-air
              if (this.playerY < 32) hit = true;
              break;

            case ObstacleType.WOODEN_BARRIER:
              // Safe only if sliding! If standing or jumping, hits high timber beam!
              if (!this.isSliding || this.playerY > 20) hit = true;
              break;

            case ObstacleType.FIRE_OBSTACLE:
              // Safe if jumped very high
              if (this.playerY < 38) hit = true;
              break;
          }

          if (hit) {
            this.handlePlayerCollision();
            obs.cleared = true;
            return;
          }
        }
      }
    }
  }

  private handlePlayerCollision() {
    if (this.hasShield) {
      // Shield absorbs the impact!
      this.hasShield = false;
      this.shieldTimer = 0;
      this.invulnerableTimer = 1.5;
      soundManager.playHit();
      this.createShieldBreakParticles();
    } else {
      // Fatal collision -> Game Over
      this.state = 'GAMEOVER';
      this.onStateChange?.(this.state);
      soundManager.playHit();
      soundManager.stopMusic();
    }
  }

  // -------------------------------------------------------------
  // MILESTONES
  // -------------------------------------------------------------
  private checkMilestones(dt: number) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.currentMilestoneToast = null;
      }
    }

    for (const m of this.milestones) {
      if (!m.achieved && this.score >= m.score) {
        m.achieved = true;
        this.currentMilestoneToast = { message: m.message, subtext: m.subtext };
        this.toastTimer = 2.4;
        soundManager.playMilestone();
        this.onMilestone?.({ message: m.message, subtext: m.subtext });
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // PARTICLE CREATION
  // -------------------------------------------------------------
  private createJumpDustParticles() {
    const proj = this.renderer.project(this.playerX * GAME_CONSTANTS.LANE_OFFSET, 0, GAME_CONSTANTS.PLAYER_Z);
    if (!proj.visible) return;

    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: proj.x + (Math.random() - 0.5) * 20,
        y: proj.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 80,
        vy: -20 - Math.random() * 30,
        size: 4 + Math.random() * 5,
        color: '#fef3c7',
        life: 0,
        maxLife: 0.35,
        alpha: 0.8,
        shape: 'circle',
      });
    }
  }

  private createCoinSparkleParticles(lane: number, coinY: number) {
    const proj = this.renderer.project(lane * GAME_CONSTANTS.LANE_OFFSET, coinY, GAME_CONSTANTS.PLAYER_Z);
    if (!proj.visible) return;

    const colors = ['#fef08a', '#fbbf24', '#ffffff', '#f59e0b'];
    for (let i = 0; i < 9; i++) {
      const ang = (i * Math.PI * 2) / 9;
      const speed = 60 + Math.random() * 50;
      this.particles.push({
        x: proj.x,
        y: proj.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 5 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 0.45,
        alpha: 1,
        shape: 'star',
      });
    }
  }

  private createPowerUpSparkleParticles(lane: number, y: number, type: PowerUpType) {
    const proj = this.renderer.project(lane * GAME_CONSTANTS.LANE_OFFSET, y, GAME_CONSTANTS.PLAYER_Z);
    if (!proj.visible) return;

    const colors = type === PowerUpType.MAGNET ? ['#38bdf8', '#0284c7', '#ffffff'] : ['#22c55e', '#86efac', '#ffffff'];
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 60;
      this.particles.push({
        x: proj.x,
        y: proj.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 6 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 0.6,
        alpha: 1,
        shape: 'star',
      });
    }
  }

  private createShieldBreakParticles() {
    const proj = this.renderer.project(this.playerX * GAME_CONSTANTS.LANE_OFFSET, 20, GAME_CONSTANTS.PLAYER_Z);
    if (!proj.visible) return;

    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 80;
      this.particles.push({
        x: proj.x,
        y: proj.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 5 + Math.random() * 5,
        color: '#22c55e',
        life: 0,
        maxLife: 0.5,
        alpha: 1,
        shape: 'star',
      });
    }
  }

  // -------------------------------------------------------------
  // RENDER DISPATCH
  // -------------------------------------------------------------
  private render(dt: number) {
    this.renderer.render(
      dt,
      {
        x: this.playerX,
        y: this.playerY,
        isSliding: this.isSliding,
        runCycle: this.runCycle,
        hasShield: this.hasShield,
        hasMagnet: this.hasMagnet,
        invulnerable: this.invulnerableTimer > 0,
        crashed: this.state === 'GAMEOVER',
      },
      this.obstacles,
      this.coins,
      this.powerUps,
      this.scenery,
      this.particles,
      this.roadOffset,
      this.gameSpeed
    );
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    soundManager.stopMusic();
  }
}
