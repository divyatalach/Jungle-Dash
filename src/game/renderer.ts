/**
 * Jungle Dash - 2.5D Canvas Game Renderer
 * High-performance, colorful, cheerful jungle & ancient temple rendering
 */
import { Coin, Obstacle, ObstacleType, Particle, PowerUpItem, PowerUpType, SceneryItem } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;
  private horizonY: number = 240;
  private focalLength: number = 380;

  // Cloud and environment animators
  private cloudOffset: number = 0;
  private animTimer: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.horizonY = height * GAME_CONSTANTS.HORIZON_RATIO;
    // Adapt focal length to screen size for crisp responsive perspective
    this.focalLength = Math.max(340, Math.min(520, width * 0.45));
  }

  /**
   * Project 3D world coordinates (x, y, z) into 2D canvas coordinates
   */
  public project(x: number, y: number, z: number, cameraX: number = 0) {
    const effZ = z - GAME_CONSTANTS.CAMERA_Z;
    if (effZ <= 5) return { x: 0, y: 0, scale: 0, visible: false };

    const scale = this.focalLength / effZ;
    const screenX = this.width / 2 + (x - cameraX) * scale;
    const screenY = this.horizonY + (GAME_CONSTANTS.CAMERA_HEIGHT - y) * scale;

    return {
      x: screenX,
      y: screenY,
      scale,
      visible: effZ > 10 && effZ < GAME_CONSTANTS.VIEW_DISTANCE + 200,
    };
  }

  /**
   * Main render loop
   */
  public render(
    dt: number,
    player: {
      x: number; // -1 to 1 lane position
      y: number; // height (jump)
      isSliding: boolean;
      runCycle: number;
      hasShield: boolean;
      hasMagnet: boolean;
      invulnerable: boolean;
      crashed: boolean;
    },
    obstacles: Obstacle[],
    coins: Coin[],
    powerUps: PowerUpItem[],
    scenery: SceneryItem[],
    particles: Particle[],
    roadOffset: number,
    gameSpeed: number
  ) {
    this.animTimer += dt;
    this.cloudOffset = (this.cloudOffset + dt * 15) % this.width;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const playerWorldX = player.x * GAME_CONSTANTS.LANE_OFFSET;

    // 1. Sky, distant mountains & tropical canopy
    this.drawSkyAndBackdrop(dt);

    // 2. Ancient Stone Road and Ground
    this.drawRoad(roadOffset, playerWorldX);

    // 3. Collect all 3D scene entities to render in depth-sorted back-to-front order
    type RenderItem = {
      z: number;
      type: 'scenery' | 'obstacle' | 'coin' | 'powerup' | 'player';
      data?: unknown;
    };

    const items: RenderItem[] = [];

    // Add scenery
    scenery.forEach((item) => {
      items.push({ z: item.z, type: 'scenery', data: item });
    });

    // Add obstacles
    obstacles.forEach((item) => {
      items.push({ z: item.z, type: 'obstacle', data: item });
    });

    // Add coins
    coins.forEach((item) => {
      if (!item.collected) {
        items.push({ z: item.z, type: 'coin', data: item });
      }
    });

    // Add power-ups
    powerUps.forEach((item) => {
      if (!item.collected) {
        items.push({ z: item.z, type: 'powerup', data: item });
      }
    });

    // Add player
    items.push({ z: GAME_CONSTANTS.PLAYER_Z, type: 'player' });

    // Sort from farthest to closest (highest Z to lowest Z)
    items.sort((a, b) => b.z - a.z);

    // Render sorted items
    for (const item of items) {
      if (item.type === 'scenery') {
        this.drawSceneryItem(item.data as SceneryItem, playerWorldX);
      } else if (item.type === 'obstacle') {
        this.drawObstacle(item.data as Obstacle, playerWorldX);
      } else if (item.type === 'coin') {
        this.drawCoin(item.data as Coin, playerWorldX);
      } else if (item.type === 'powerup') {
        this.drawPowerUp(item.data as PowerUpItem, playerWorldX);
      } else if (item.type === 'player') {
        this.drawPlayer(player, playerWorldX);
      }
    }

    // 4. Foreground / Floating particles (sparks, dust, coins)
    this.drawParticles(particles, playerWorldX);

    // 5. Speed wind streaks when running fast
    if (gameSpeed > 500) {
      this.drawSpeedVFX(gameSpeed);
    }
  }

  // -------------------------------------------------------------
  // SKY & ENVIRONMENT BACKGROUND
  // -------------------------------------------------------------
  private drawSkyAndBackdrop(dt: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.horizonY;

    // Cheerful bright tropical gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#38bdf8');   // Vivid Sky Blue
    skyGrad.addColorStop(0.5, '#7dd3fc'); // Light Aqua Blue
    skyGrad.addColorStop(0.85, '#fef08a'); // Warm Tropical Sunlight
    skyGrad.addColorStop(1, '#fed7aa');   // Peachy warm horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Cheerful Sun with rays
    const sunX = w * 0.75;
    const sunY = h * 0.35;
    const sunRadius = Math.min(w, h) * 0.12;

    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(this.animTimer * 0.1);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, sunRadius * 1.8, (i * Math.PI) / 4 - 0.12, (i * Math.PI) / 4 + 0.12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Solid warm sun core
    const sunCoreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunCoreGrad.addColorStop(0, '#ffffff');
    sunCoreGrad.addColorStop(0.5, '#fef08a');
    sunCoreGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = sunCoreGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Cartoon Clouds
    this.drawCloud((w * 0.15 + this.cloudOffset * 0.5) % (w + 200) - 100, h * 0.22, 60);
    this.drawCloud((w * 0.55 + this.cloudOffset * 0.7) % (w + 200) - 100, h * 0.38, 45);
    this.drawCloud((w * 0.85 + this.cloudOffset * 0.3) % (w + 200) - 100, h * 0.15, 75);

    // Distant Ancient Volcanic Peaks / Misty Jungle Mountains
    ctx.fillStyle = '#6ee7b7'; // Mint emerald mist
    ctx.beginPath();
    ctx.moveTo(0, h);
    const mtnPoints = [
      [0, h * 0.85],
      [w * 0.2, h * 0.55],
      [w * 0.38, h * 0.72],
      [w * 0.5, h * 0.5],
      [w * 0.65, h * 0.68],
      [w * 0.82, h * 0.45],
      [w, h * 0.75],
      [w, h],
    ];
    ctx.moveTo(mtnPoints[0][0], mtnPoints[0][1]);
    for (let i = 1; i < mtnPoints.length; i++) {
      ctx.lineTo(mtnPoints[i][0], mtnPoints[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // Closer Emerald Jungle Canopy Ridge
    const canopyGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
    canopyGrad.addColorStop(0, '#10b981');
    canopyGrad.addColorStop(1, '#047857');
    ctx.fillStyle = canopyGrad;

    ctx.beginPath();
    ctx.moveTo(0, h);
    const canopyBumpCount = 14;
    const bumpWidth = w / canopyBumpCount;
    for (let i = 0; i <= canopyBumpCount; i++) {
      const bx = i * bumpWidth;
      const by = h - 25 - Math.sin(i * 1.5 + this.animTimer * 0.5) * 12;
      ctx.quadraticCurveTo(bx - bumpWidth / 2, by - 16, bx, by);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Ancient Temple Golden Top peeking from jungle
    const templeX = w * 0.48;
    const templeY = h - 28;
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(templeX - 25, templeY);
    ctx.lineTo(templeX - 14, templeY - 26);
    ctx.lineTo(templeX + 14, templeY - 26);
    ctx.lineTo(templeX + 25, templeY);
    ctx.closePath();
    ctx.fill();
    // Temple Cap
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(templeX - 10, templeY - 32, 20, 6);
  }

  private drawCloud(x: number, y: number, scale: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.5, 0, Math.PI * 2);
    ctx.arc(x + scale * 0.35, y - scale * 0.2, scale * 0.42, 0, Math.PI * 2);
    ctx.arc(x + scale * 0.75, y, scale * 0.45, 0, Math.PI * 2);
    ctx.arc(x + scale * 0.4, y + scale * 0.15, scale * 0.38, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // -------------------------------------------------------------
  // ANCIENT STONE ROAD & TERRAIN
  // -------------------------------------------------------------
  private drawRoad(roadOffset: number, cameraX: number) {
    const ctx = this.ctx;
    const h = this.height;
    const w = this.width;

    // Side grass terrain ground fill
    const grassGrad = ctx.createLinearGradient(0, this.horizonY, 0, h);
    grassGrad.addColorStop(0, '#15803d'); // Deep jungle emerald
    grassGrad.addColorStop(0.5, '#16a34a'); // Lush grass
    grassGrad.addColorStop(1, '#22c55e'); // Bright front grass
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, this.horizonY, w, h - this.horizonY);

    // Segmented Stone Road projection
    const sliceCount = 38;
    const segLength = GAME_CONSTANTS.VIEW_DISTANCE / sliceCount;

    // Modulo segment alignment for continuous rushing road movement
    const baseZ = (roadOffset % segLength);

    for (let i = sliceCount; i >= 1; i--) {
      const zFar = i * segLength - baseZ;
      const zNear = (i - 1) * segLength - baseZ;

      if (zFar <= 10) continue;
      const pFarLeft = this.project(-GAME_CONSTANTS.ROAD_WIDTH / 2, 0, zFar, cameraX);
      const pFarRight = this.project(GAME_CONSTANTS.ROAD_WIDTH / 2, 0, zFar, cameraX);
      const pNearLeft = this.project(-GAME_CONSTANTS.ROAD_WIDTH / 2, 0, zNear, cameraX);
      const pNearRight = this.project(GAME_CONSTANTS.ROAD_WIDTH / 2, 0, zNear, cameraX);

      if (!pFarLeft.visible && !pNearLeft.visible) continue;

      // Alternating ancient stone slab colors
      const isAlt = (Math.floor((zFar + roadOffset) / segLength)) % 2 === 0;

      // Stone slab fill
      ctx.fillStyle = isAlt ? '#d97706' : '#b45309'; // Warm ancient sandstone
      ctx.beginPath();
      ctx.moveTo(pFarLeft.x, pFarLeft.y);
      ctx.lineTo(pFarRight.x, pFarRight.y);
      ctx.lineTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pNearLeft.x, pNearLeft.y);
      ctx.closePath();
      ctx.fill();

      // Stone paving center inlay (slightly lighter sandy stone)
      const inlayMargin = 16;
      const pFarInLeft = this.project(-GAME_CONSTANTS.ROAD_WIDTH / 2 + inlayMargin, 0, zFar, cameraX);
      const pFarInRight = this.project(GAME_CONSTANTS.ROAD_WIDTH / 2 - inlayMargin, 0, zFar, cameraX);
      const pNearInRight = this.project(GAME_CONSTANTS.ROAD_WIDTH / 2 - inlayMargin, 0, zNear, cameraX);
      const pNearInLeft = this.project(-GAME_CONSTANTS.ROAD_WIDTH / 2 + inlayMargin, 0, zNear, cameraX);

      ctx.fillStyle = isAlt ? '#fef3c7' : '#fde68a';
      ctx.beginPath();
      ctx.moveTo(pFarInLeft.x, pFarInLeft.y);
      ctx.lineTo(pFarInRight.x, pFarInRight.y);
      ctx.lineTo(pNearInRight.x, pNearInRight.y);
      ctx.lineTo(pNearInLeft.x, pNearInLeft.y);
      ctx.closePath();
      ctx.fill();

      // Stone border curbs (raised stone rim)
      const curbWidth = 22;
      // Left curb
      const pFarCurbLeft = this.project(-GAME_CONSTANTS.ROAD_WIDTH / 2 - curbWidth, 12, zFar, cameraX);
      const pNearCurbLeft = this.project(-GAME_CONSTANTS.ROAD_WIDTH / 2 - curbWidth, 12, zNear, cameraX);
      ctx.fillStyle = isAlt ? '#92400e' : '#78350f';
      ctx.beginPath();
      ctx.moveTo(pFarCurbLeft.x, pFarCurbLeft.y);
      ctx.lineTo(pFarLeft.x, pFarLeft.y);
      ctx.lineTo(pNearLeft.x, pNearLeft.y);
      ctx.lineTo(pNearCurbLeft.x, pNearCurbLeft.y);
      ctx.closePath();
      ctx.fill();

      // Right curb
      const pFarCurbRight = this.project(GAME_CONSTANTS.ROAD_WIDTH / 2 + curbWidth, 12, zFar, cameraX);
      const pNearCurbRight = this.project(GAME_CONSTANTS.ROAD_WIDTH / 2 + curbWidth, 12, zNear, cameraX);
      ctx.fillStyle = isAlt ? '#92400e' : '#78350f';
      ctx.beginPath();
      ctx.moveTo(pFarRight.x, pFarRight.y);
      ctx.lineTo(pFarCurbRight.x, pFarCurbRight.y);
      ctx.lineTo(pNearCurbRight.x, pNearCurbRight.y);
      ctx.lineTo(pNearRight.x, pNearRight.y);
      ctx.closePath();
      ctx.fill();

      // Lane dividers (carved golden Aztec rune lines)
      const lane1X = -GAME_CONSTANTS.LANE_OFFSET * 0.5;
      const lane2X = GAME_CONSTANTS.LANE_OFFSET * 0.5;

      const pFL1 = this.project(lane1X, 0, zFar, cameraX);
      const pNL1 = this.project(lane1X, 0, zNear, cameraX);
      const pFL2 = this.project(lane2X, 0, zFar, cameraX);
      const pNL2 = this.project(lane2X, 0, zNear, cameraX);

      ctx.strokeStyle = isAlt ? 'rgba(217, 119, 6, 0.5)' : 'rgba(180, 83, 9, 0.4)';
      ctx.lineWidth = Math.max(1, pNearLeft.scale * 3);
      ctx.beginPath();
      ctx.moveTo(pFL1.x, pFL1.y);
      ctx.lineTo(pNL1.x, pNL1.y);
      ctx.moveTo(pFL2.x, pFL2.y);
      ctx.lineTo(pNL2.x, pNL2.y);
      ctx.stroke();
    }
  }

  // -------------------------------------------------------------
  // SCENERY ITEMS (PALM TREES, TORCHES, TOTEMS, ARCHES)
  // -------------------------------------------------------------
  private drawSceneryItem(item: SceneryItem, cameraX: number) {
    const ctx = this.ctx;
    const roadHalf = GAME_CONSTANTS.ROAD_WIDTH / 2 + 55;
    const worldX = item.side * roadHalf;
    const p = this.project(worldX, 0, item.z, cameraX);

    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    const s = p.scale;

    switch (item.type) {
      case 'PALM_TREE': {
        // Cheerful cartoon coconut palm tree
        const trunkH = 170 * s;
        const trunkW = 18 * s;
        // Curved trunk
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(-trunkW / 2, 0);
        ctx.quadraticCurveTo(item.side * 25 * s, -trunkH * 0.5, item.side * 18 * s - trunkW * 0.3, -trunkH);
        ctx.lineTo(item.side * 18 * s + trunkW * 0.3, -trunkH);
        ctx.quadraticCurveTo(item.side * 25 * s + trunkW, -trunkH * 0.5, trunkW / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Lush green palm fronds
        const crownX = item.side * 18 * s;
        const crownY = -trunkH;
        const leafColors = ['#15803d', '#22c55e', '#4ade80', '#16a34a'];

        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3 + (item.variant * 0.3);
          const leafLen = 75 * s;
          ctx.fillStyle = leafColors[a % leafColors.length];
          ctx.beginPath();
          ctx.ellipse(
            crownX + Math.cos(angle) * (leafLen * 0.5),
            crownY + Math.sin(angle) * (leafLen * 0.35),
            leafLen * 0.5,
            leafLen * 0.22,
            angle,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Coconuts
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(crownX - 6 * s, crownY + 4 * s, 6 * s, 0, Math.PI * 2);
        ctx.arc(crownX + 6 * s, crownY + 4 * s, 6 * s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'TORCH': {
        // Stone ceremonial fire brazier
        const torchH = 70 * s;
        // Stone pedestal
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-10 * s, -torchH, 20 * s, torchH);
        // Golden bowl
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(0, -torchH, 18 * s, 8 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing fire flame
        const flameH = (22 + Math.sin(this.animTimer * 12 + item.z) * 6) * s;
        const flameGrad = ctx.createRadialGradient(0, -torchH - flameH * 0.4, 0, 0, -torchH - flameH * 0.4, flameH);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#fef08a');
        flameGrad.addColorStop(0.7, '#f97316');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-12 * s, -torchH);
        ctx.quadraticCurveTo(-14 * s, -torchH - flameH * 0.6, 0, -torchH - flameH);
        ctx.quadraticCurveTo(14 * s, -torchH - flameH * 0.6, 12 * s, -torchH);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'STONE_STATUE': {
        // Ancient Aztec / Mayan stone tiki head
        const statueH = 90 * s;
        const statueW = 40 * s;
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-statueW / 2, -statueH, statueW, statueH);
        // Carved forehead runes
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-statueW * 0.35, -statueH + 10 * s, statueW * 0.7, 8 * s);
        // Glowing friendly eyes
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-statueW * 0.3, -statueH + 28 * s, 8 * s, 8 * s);
        ctx.fillRect(statueW * 0.1, -statueH + 28 * s, 8 * s, 8 * s);
        // Smiling carved mouth
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-statueW * 0.3, -statueH + 48 * s, statueW * 0.6, 10 * s);
        break;
      }

      case 'TEMPLE_PILLAR': {
        // Ancient carved stone obelisk/pillar
        const pillarH = 130 * s;
        const pillarW = 28 * s;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-pillarW / 2, -pillarH, pillarW, pillarH);
        // Stepped base
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-pillarW * 0.7, -12 * s, pillarW * 1.4, 12 * s);
        // Ivy vines wrapped around
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4 * s;
        ctx.beginPath();
        ctx.moveTo(-pillarW / 2, 0);
        ctx.lineTo(pillarW / 2, -pillarH * 0.3);
        ctx.lineTo(-pillarW / 2, -pillarH * 0.6);
        ctx.lineTo(pillarW / 2, -pillarH * 0.9);
        ctx.stroke();
        break;
      }

      case 'TEMPLE_ARCH': {
        // Giant ancient stone arch crossing over the entire roadway!
        const archSpan = GAME_CONSTANTS.ROAD_WIDTH * 1.2 * s;
        const archH = 220 * s;
        const colW = 32 * s;

        ctx.fillStyle = '#b45309';
        // Left Column
        ctx.fillRect(-archSpan / 2, -archH, colW, archH);
        // Right Column
        ctx.fillRect(archSpan / 2 - colW, -archH, colW, archH);
        // Overhead beam
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-archSpan / 2 - 10 * s, -archH, archSpan + 20 * s, 36 * s);

        // Hanging jungle vines
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3 * s;
        for (let v = 0; v < 5; v++) {
          const vx = -archSpan * 0.35 + v * (archSpan * 0.18);
          ctx.beginPath();
          ctx.moveTo(vx, -archH + 36 * s);
          ctx.quadraticCurveTo(vx + 6 * s, -archH + 70 * s, vx - 4 * s, -archH + 90 * s);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // OBSTACLES (FALLEN TREE, LARGE ROCK, BROKEN BRIDGE, WOODEN BARRIER, FIRE)
  // -------------------------------------------------------------
  private drawObstacle(obs: Obstacle, cameraX: number) {
    const ctx = this.ctx;
    const worldX = obs.lane * GAME_CONSTANTS.LANE_OFFSET;
    const p = this.project(worldX, 0, obs.z, cameraX);

    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    const s = p.scale;

    switch (obs.type) {
      case ObstacleType.FALLEN_TREE: {
        // Chunky mossy cartoon jungle log (JUMP OVER)
        const logW = 90 * s;
        const logH = 26 * s;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 2 * s, logW * 0.52, 7 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main wood log trunk
        ctx.fillStyle = '#78350f'; // Dark wood
        ctx.beginPath();
        ctx.roundRect(-logW / 2, -logH, logW, logH, 6 * s);
        ctx.fill();

        // Wood end concentric ring
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(-logW / 2 + 5 * s, -logH / 2, 5 * s, logH * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Moss patch on top
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(-logW * 0.3, -logH - 3 * s, logW * 0.6, 6 * s, 3 * s);
        ctx.fill();

        // Cute red jungle mushrooms sprouting
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-logW * 0.15, -logH - 6 * s, 5 * s, Math.PI, 0);
        ctx.arc(logW * 0.18, -logH - 8 * s, 6 * s, Math.PI, 0);
        ctx.fill();
        // White mushroom dots
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-logW * 0.16, -logH - 5 * s, 2 * s, 2 * s);
        ctx.fillRect(logW * 0.16, -logH - 7 * s, 2 * s, 2 * s);

        // Jump arrow badge indicator to help kids
        if (obs.z > 60 && obs.z < 450) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(0, -logH - 24 * s);
          ctx.lineTo(-8 * s, -logH - 14 * s);
          ctx.lineTo(8 * s, -logH - 14 * s);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case ObstacleType.LARGE_ROCK: {
        // Massive ancient boulder blocking lane (SWITCH LANES)
        const rockW = 85 * s;
        const rockH = 80 * s;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 2 * s, rockW * 0.55, 12 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone boulder main shape
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(-rockW * 0.45, 0);
        ctx.lineTo(-rockW * 0.5, -rockH * 0.4);
        ctx.lineTo(-rockW * 0.3, -rockH * 0.9);
        ctx.lineTo(rockW * 0.2, -rockH);
        ctx.lineTo(rockW * 0.5, -rockH * 0.6);
        ctx.lineTo(rockW * 0.45, 0);
        ctx.closePath();
        ctx.fill();

        // Highlight facet
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.moveTo(-rockW * 0.25, -rockH * 0.85);
        ctx.lineTo(rockW * 0.15, -rockH * 0.95);
        ctx.lineTo(rockW * 0.35, -rockH * 0.55);
        ctx.lineTo(-rockW * 0.1, -rockH * 0.45);
        ctx.closePath();
        ctx.fill();

        // Carved ancient glyph / face on rock
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.arc(-10 * s, -rockH * 0.5, 6 * s, 0, Math.PI * 2);
        ctx.arc(12 * s, -rockH * 0.5, 6 * s, 0, Math.PI * 2);
        ctx.stroke();

        // Moss blanket
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(-rockW * 0.15, -rockH * 0.9, 14 * s, 0, Math.PI);
        ctx.fill();
        break;
      }

      case ObstacleType.BROKEN_BRIDGE: {
        // Pit / Chasm in stone walkway with wooden fragments (JUMP OVER)
        const gapW = 100 * s;
        const gapH = 34 * s;

        // Dark abyss / water chasm below
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, 0, gapW * 0.5, gapH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sparkling blue tropical underground river inside pit
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(0, 4 * s, gapW * 0.4, gapH * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Broken splintered wooden bridge planks
        ctx.fillStyle = '#78350f';
        // Left broken plank
        ctx.fillRect(-gapW * 0.48, -4 * s, gapW * 0.22, 8 * s);
        // Right broken plank
        ctx.fillRect(gapW * 0.26, -4 * s, gapW * 0.22, 8 * s);

        // Warning ropes
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 * s;
        ctx.strokeRect(-gapW * 0.5, -8 * s, gapW, 16 * s);

        // Jump arrow badge
        if (obs.z > 60 && obs.z < 450) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(0, -gapH - 20 * s);
          ctx.lineTo(-8 * s, -gapH - 10 * s);
          ctx.lineTo(8 * s, -gapH - 10 * s);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case ObstacleType.WOODEN_BARRIER: {
        // High ancient temple beam supported on stone posts (SLIDE UNDER)
        const barW = 100 * s;
        const totalH = 88 * s;
        const beamH = 26 * s;
        const clearH = totalH - beamH; // Clearance for sliding player

        // Left & right supporting poles
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-barW / 2, -totalH, 12 * s, totalH);
        ctx.fillRect(barW / 2 - 12 * s, -totalH, 12 * s, totalH);

        // High horizontal temple beam
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-barW / 2 - 4 * s, -totalH, barW + 8 * s, beamH);

        // "SLIDE!" or Warning Chevron pattern
        ctx.fillStyle = '#f59e0b';
        for (let c = 0; c < 5; c++) {
          const cx = -barW * 0.38 + c * (barW * 0.18);
          ctx.beginPath();
          ctx.moveTo(cx, -totalH);
          ctx.lineTo(cx + 8 * s, -totalH);
          ctx.lineTo(cx + 14 * s, -totalH + beamH);
          ctx.lineTo(cx + 6 * s, -totalH + beamH);
          ctx.closePath();
          ctx.fill();
        }

        // Downward slide arrow badge to clearly guide players
        if (obs.z > 60 && obs.z < 450) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(0, -clearH * 0.3);
          ctx.lineTo(-8 * s, -clearH * 0.65);
          ctx.lineTo(8 * s, -clearH * 0.65);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case ObstacleType.FIRE_OBSTACLE: {
        // Ancient ceremonial stone fire pit (AVOID OR JUMP)
        const pitW = 60 * s;
        const pitH = 35 * s;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, pitW * 0.5, 10 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone bowl
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(0, -pitH * 0.4, pitW * 0.45, pitH * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dancing lively cartoon flames
        const flameAnim = Math.sin(this.animTimer * 15 + obs.z) * 6 * s;
        const fH = (45 * s) + flameAnim;

        const flameGrad = ctx.createLinearGradient(0, -pitH * 0.4, 0, -pitH * 0.4 - fH);
        flameGrad.addColorStop(0, '#f97316');
        flameGrad.addColorStop(0.5, '#facc15');
        flameGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = flameGrad;

        ctx.beginPath();
        ctx.moveTo(-pitW * 0.35, -pitH * 0.4);
        ctx.quadraticCurveTo(-pitW * 0.4, -pitH * 0.4 - fH * 0.5, 0, -pitH * 0.4 - fH);
        ctx.quadraticCurveTo(pitW * 0.4, -pitH * 0.4 - fH * 0.5, pitW * 0.35, -pitH * 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // COINS (SPINNING 3D GOLD COIN)
  // -------------------------------------------------------------
  private drawCoin(coin: Coin, cameraX: number) {
    const ctx = this.ctx;
    const worldX = coin.lane * GAME_CONSTANTS.LANE_OFFSET;
    const p = this.project(worldX, coin.y, coin.z, cameraX);

    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    const s = p.scale;

    // Shadow on ground
    const pGround = this.project(worldX, 0, coin.z, cameraX);
    ctx.restore();

    ctx.save();
    ctx.translate(pGround.x, pGround.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);

    // 3D Coin Rotation calculation
    const spinFactor = Math.cos(coin.angle);
    const coinR = 18 * s;
    const coinW = Math.max(2, Math.abs(spinFactor) * coinR);

    // Outer rim & thickness
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, coinW + 2 * s, coinR, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden face
    const coinGrad = ctx.createLinearGradient(-coinW, -coinR, coinW, coinR);
    coinGrad.addColorStop(0, '#fef08a');
    coinGrad.addColorStop(0.5, '#eab308');
    coinGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = coinGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, coinW, coinR - 1.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aztec inner square star glyph
    if (Math.abs(spinFactor) > 0.4) {
      ctx.fillStyle = '#78350f';
      const sqW = coinW * 0.45;
      const sqH = coinR * 0.45;
      ctx.fillRect(-sqW / 2, -sqH / 2, sqW, sqH);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-sqW * 0.3, -sqH * 0.3, sqW * 0.6, sqH * 0.6);
    }

    // Sparkle sheen
    if (Math.abs(spinFactor) > 0.7) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(coinW * 0.35, -coinR * 0.35, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // POWER-UPS (MAGNET, SHIELD)
  // -------------------------------------------------------------
  private drawPowerUp(item: PowerUpItem, cameraX: number) {
    const ctx = this.ctx;
    const worldX = item.lane * GAME_CONSTANTS.LANE_OFFSET;
    const p = this.project(worldX, item.y, item.z, cameraX);

    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    const s = p.scale;
    const bob = Math.sin(this.animTimer * 5) * 6 * s;

    // Glowing aura
    const auraColor = item.type === PowerUpType.MAGNET ? 'rgba(56, 189, 248, 0.4)' : 'rgba(34, 197, 94, 0.4)';
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, bob, 26 * s, 0, Math.PI * 2);
    ctx.fill();

    if (item.type === PowerUpType.MAGNET) {
      // Blue Horseshoe Magnet
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 10 * s;
      ctx.beginPath();
      ctx.arc(0, bob - 2 * s, 14 * s, Math.PI, 0, true);
      ctx.stroke();

      // Red/Silver magnetic tips
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-19 * s, bob - 2 * s, 10 * s, 10 * s);
      ctx.fillRect(9 * s, bob - 2 * s, 10 * s, 10 * s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-19 * s, bob + 6 * s, 10 * s, 4 * s);
      ctx.fillRect(9 * s, bob + 6 * s, 10 * s, 4 * s);
    } else {
      // Emerald Jade Shield Totem
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, bob - 20 * s);
      ctx.lineTo(16 * s, bob - 8 * s);
      ctx.lineTo(12 * s, bob + 14 * s);
      ctx.lineTo(0, bob + 22 * s);
      ctx.lineTo(-12 * s, bob + 14 * s);
      ctx.lineTo(-16 * s, bob - 8 * s);
      ctx.closePath();
      ctx.fill();

      // Golden emblem in center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, bob, 6 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLAYER CHARACTER (CUTE JUNGLE EXPLORER)
  // -------------------------------------------------------------
  private drawPlayer(
    player: {
      x: number;
      y: number;
      isSliding: boolean;
      runCycle: number;
      hasShield: boolean;
      hasMagnet: boolean;
      invulnerable: boolean;
      crashed: boolean;
    },
    cameraX: number
  ) {
    const ctx = this.ctx;
    const worldX = player.x * GAME_CONSTANTS.LANE_OFFSET;
    const p = this.project(worldX, player.y, GAME_CONSTANTS.PLAYER_Z, cameraX);

    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    const s = p.scale;

    // Faint blink effect if invulnerable
    if (player.invulnerable && Math.floor(this.animTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Shadow on stone floor
    const pGround = this.project(worldX, 0, GAME_CONSTANTS.PLAYER_Z, cameraX);
    ctx.restore();

    ctx.save();
    ctx.translate(pGround.x, pGround.y);
    // Shadow shrinks and lightens as player jumps higher
    const jumpProgress = Math.min(1, player.y / 200);
    const shadowScale = (1 - jumpProgress * 0.45) * s;
    const shadowAlpha = 0.35 * (1 - jumpProgress * 0.6);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Now render player body
    ctx.save();
    ctx.translate(p.x, p.y);

    if (player.isSliding) {
      // ------------------------------------
      // SLIDING POSE: low to ground, knees forward, sliding back
      // ------------------------------------
      const slideW = 54 * s;
      const slideH = 26 * s;

      // Sliding dirt/stone friction sparks
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < 4; i++) {
        const sx = (Math.random() - 0.5) * slideW;
        ctx.fillRect(sx, 4 * s, 3 * s, 3 * s);
      }

      // Torso angled back
      ctx.fillStyle = '#0284c7'; // Blue adventure shirt
      ctx.beginPath();
      ctx.roundRect(-slideW * 0.4, -slideH, slideW * 0.8, slideH * 0.7, 5 * s);
      ctx.fill();

      // Khaki adventurer vest
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-slideW * 0.4, -slideH, slideW * 0.3, slideH * 0.7);
      ctx.fillRect(slideW * 0.1, -slideH, slideW * 0.3, slideH * 0.7);

      // Adventurer Backpack
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-slideW * 0.45, -slideH - 10 * s, 20 * s, 16 * s, 4 * s);
      ctx.fill();

      // Head with Safari Hat ducked low
      const headX = slideW * 0.18;
      const headY = -slideH - 4 * s;
      ctx.fillStyle = '#fcd34d'; // Skin tone
      ctx.beginPath();
      ctx.arc(headX, headY, 11 * s, 0, Math.PI * 2);
      ctx.fill();

      // Pith Safari Helmet
      ctx.fillStyle = '#fef3c7'; // Khaki helmet
      ctx.beginPath();
      ctx.ellipse(headX, headY - 4 * s, 18 * s, 7 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706'; // Hat band
      ctx.fillRect(headX - 10 * s, headY - 8 * s, 20 * s, 3 * s);

      // Sliding Legs & boots out in front
      ctx.fillStyle = '#451a03'; // Boots
      ctx.beginPath();
      ctx.ellipse(slideW * 0.4, -4 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ------------------------------------
      // RUNNING OR JUMPING POSE
      // ------------------------------------
      const isJumping = player.y > 5;
      const legStride = isJumping ? 0 : Math.sin(player.runCycle);
      const armStride = isJumping ? 0 : Math.cos(player.runCycle);
      const bob = isJumping ? 0 : Math.abs(Math.sin(player.runCycle * 2)) * 5 * s;

      const playerH = 68 * s;
      const torsoY = -playerH * 0.45 - bob;

      // Legs
      const legLength = 22 * s;
      ctx.lineWidth = 9 * s;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0369a1'; // Blue explorer shorts/pants

      if (isJumping) {
        // Tucked bent legs for jump
        ctx.beginPath();
        ctx.moveTo(-8 * s, torsoY + 12 * s);
        ctx.lineTo(-12 * s, torsoY + 22 * s);
        ctx.moveTo(8 * s, torsoY + 12 * s);
        ctx.lineTo(12 * s, torsoY + 22 * s);
        ctx.stroke();

        // Hiking boots
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(-12 * s, torsoY + 24 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(12 * s, torsoY + 24 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Running stride
        // Left Leg
        const leftLegY = torsoY + 14 * s + legStride * 10 * s;
        ctx.beginPath();
        ctx.moveTo(-8 * s, torsoY + 10 * s);
        ctx.lineTo(-8 * s, leftLegY);
        ctx.stroke();

        // Right Leg
        const rightLegY = torsoY + 14 * s - legStride * 10 * s;
        ctx.beginPath();
        ctx.moveTo(8 * s, torsoY + 10 * s);
        ctx.lineTo(8 * s, rightLegY);
        ctx.stroke();

        // Brown hiking boots
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(-8 * s, leftLegY + 3 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(8 * s, rightLegY + 3 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Torso / Shirt
      ctx.fillStyle = '#0284c7'; // Adventure Blue
      ctx.beginPath();
      ctx.roundRect(-16 * s, torsoY - 14 * s, 32 * s, 26 * s, 6 * s);
      ctx.fill();

      // Khaki Adventure Vest over shirt
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-16 * s, torsoY - 14 * s, 10 * s, 26 * s);
      ctx.fillRect(6 * s, torsoY - 14 * s, 10 * s, 26 * s);

      // Explorer Backpack (sitting on back)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-14 * s, torsoY - 20 * s, 28 * s, 20 * s, 5 * s);
      ctx.fill();

      // Bedroll rolled on top of backpack
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(-16 * s, torsoY - 25 * s, 32 * s, 7 * s, 3 * s);
      ctx.fill();

      // Arms swinging
      ctx.lineWidth = 7 * s;
      ctx.strokeStyle = '#fcd34d'; // Skin tone arms
      if (isJumping) {
        // Arms spread in joy / balance
        ctx.beginPath();
        ctx.moveTo(-14 * s, torsoY - 8 * s);
        ctx.lineTo(-26 * s, torsoY - 18 * s);
        ctx.moveTo(14 * s, torsoY - 8 * s);
        ctx.lineTo(26 * s, torsoY - 18 * s);
        ctx.stroke();
      } else {
        // Alternating arm swing
        ctx.beginPath();
        ctx.moveTo(-14 * s, torsoY - 8 * s);
        ctx.lineTo(-20 * s, torsoY - 4 * s + armStride * 10 * s);
        ctx.moveTo(14 * s, torsoY - 8 * s);
        ctx.lineTo(20 * s, torsoY - 4 * s - armStride * 10 * s);
        ctx.stroke();
      }

      // Explorer Head
      const headY = torsoY - 26 * s;
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(0, headY, 15 * s, 0, Math.PI * 2);
      ctx.fill();

      // Cute ears
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(-15 * s, headY, 4 * s, 0, Math.PI * 2);
      ctx.arc(15 * s, headY, 4 * s, 0, Math.PI * 2);
      ctx.fill();

      // Cute hair back
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, headY + 3 * s, 15 * s, 0, Math.PI);
      ctx.fill();

      // Safari / Pith Helmet
      ctx.fillStyle = '#fef3c7'; // Warm ivory khaki
      ctx.beginPath();
      // Wide circular brim
      ctx.ellipse(0, headY - 6 * s, 25 * s, 9 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // Helmet Dome
      ctx.beginPath();
      ctx.arc(0, headY - 10 * s, 16 * s, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Leather helmet band with golden buckle
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-15 * s, headY - 10 * s, 30 * s, 4 * s);
      ctx.fillStyle = '#f59e0b'; // Gold buckle
      ctx.fillRect(-3 * s, headY - 11 * s, 6 * s, 6 * s);
    }

    // Shield Aura if active
    if (player.hasShield) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4 * s;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.beginPath();
      ctx.arc(0, -32 * s, 46 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating sparkles on shield rim
      const ringAngle = this.animTimer * 4;
      ctx.fillStyle = '#86efac';
      for (let r = 0; r < 3; r++) {
        const a = ringAngle + (r * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 46 * s, -32 * s + Math.sin(a) * 46 * s, 4 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Magnet sparks if active
    if (player.hasMagnet) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * s;
      for (let m = 0; m < 4; m++) {
        const ang = this.animTimer * 6 + m * 1.5;
        const rad = (30 + Math.sin(this.animTimer * 10 + m) * 12) * s;
        ctx.beginPath();
        ctx.arc(0, -30 * s, rad, ang, ang + 0.6);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PARTICLES (COIN SPARKLES, DUST PUFFS)
  // -------------------------------------------------------------
  private drawParticles(particles: Particle[], cameraX: number) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        // 4-point sparkle star
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        const r = p.size;
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle / dust puff
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // SPEED WIND STREAKS (WHEN RUNNING FAST)
  // -------------------------------------------------------------
  private drawSpeedVFX(gameSpeed: number) {
    const ctx = this.ctx;
    const intensity = Math.min(1, (gameSpeed - 500) / 300);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * intensity})`;
    ctx.lineWidth = 2;

    const streakCount = 8;
    for (let i = 0; i < streakCount; i++) {
      const sx = (i * (this.width / streakCount) + (this.animTimer * 300) % this.width);
      const sy = this.horizonY + 30 + (i * 37) % (this.height - this.horizonY - 50);
      const len = 40 + intensity * 60;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - (sx - this.width / 2) * 0.15, sy + len);
      ctx.stroke();
    }
    ctx.restore();
  }
}
