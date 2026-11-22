import type { Difficulty, GameSummary } from "../types";
import type { Sfx } from "../lib/sound";
import { bossPhrases, gameWordsByLength } from "../lib/words";

/**
 * Void Defender: a ZType-style typing shooter.
 * Pure TypeScript with no React or DOM dependency besides the 2D context passed to render(),
 * so the rules can be tested headlessly.
 */

export const W = 1000;
export const H = 640;
const SHIP_X = W / 2;
const SHIP_Y = H - 64;
const BULLET_SPEED = 1700;
const MONO = 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';

export type Phase = "menu" | "playing" | "paused" | "over";
type Kind = "drone" | "dart" | "tank" | "boss";
type Stage = "banner" | "spawn" | "clear" | "done";

export interface Palette {
  accent: string;
  error: string;
}
export interface GameEvents {
  onPhase: (phase: Phase, summary?: GameSummary) => void;
  onSfx: (kind: Sfx, param?: number) => void;
}

const DIFF: Record<Difficulty, { speed: number; spawn: number; hp: number }> = {
  easy: { speed: 0.75, spawn: 0.8, hp: 150 },
  normal: { speed: 1, spawn: 1, hp: 100 },
  hard: { speed: 1.3, spawn: 1.25, hp: 70 },
};

const KIND: Record<Kind, { color: string; r: number; dmg: number; speed: number; pts: number }> = {
  drone: { color: "#38bdf8", r: 18, dmg: 15, speed: 1, pts: 15 },
  dart: { color: "#f472b6", r: 14, dmg: 12, speed: 1.75, pts: 22 },
  tank: { color: "#fb923c", r: 27, dmg: 25, speed: 0.62, pts: 24 },
  boss: { color: "#a78bfa", r: 48, dmg: 45, speed: 0.4, pts: 40 },
};

interface Enemy {
  id: number;
  kind: Kind;
  word: string;
  typed: number;
  x: number;
  y: number;
  baseX: number;
  vy: number;
  r: number;
  age: number;
  wob: number;
  amp: number;
  phase: number;
  doomed: boolean; // fully typed, waiting for its last bullet to land
  dead: boolean;
  pending: number; // bullets still in flight toward it
  flash: number;
  dmg: number;
  points: number;
}
interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  target: Enemy;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  ring: boolean;
}
interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
}
interface Star {
  x: number;
  y: number;
  z: number;
}
interface WaveState {
  n: number;
  stage: Stage;
  timer: number;
  toSpawn: number;
  spawnTimer: number;
  boss: boolean;
  bossPending: boolean;
  hits: number;
  misses: number;
  bonus: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const rint = (a: number, b: number) => Math.floor(rnd(a, b + 1));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function hexA(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function poly(ctx: CanvasRenderingContext2D, sides: number, r: number, rot: number) {
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class VoidDefender {
  phase: Phase = "menu";

  private diff: Difficulty = "normal";
  private t = 0;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private parts: Particle[] = [];
  private floats: Floater[] = [];
  private stars: Star[] = [];
  private target: Enemy | null = null;
  private nextId = 1;
  private aim = 0;

  private score = 0;
  private hp = 100;
  private maxHp = 100;
  private combo = 0;
  private maxCombo = 0;
  private kills = 0;
  private correct = 0;
  private misses = 0;
  private playTime = 0;
  private charge = 0;

  private shake = 0;
  private hurt = 0;
  private missFlash = 0;
  private wave: WaveState = this.makeWave(1);

  constructor(private ev: GameEvents, private pal: Palette) {
    for (let i = 0; i < 110; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() });
  }

  // ---------------------------------------------------------------- lifecycle

  start(diff: Difficulty, pal: Palette): void {
    this.diff = diff;
    this.pal = pal;
    this.enemies = [];
    this.bullets = [];
    this.parts = [];
    this.floats = [];
    this.target = null;
    this.score = this.kills = this.correct = this.misses = this.maxCombo = this.combo = 0;
    this.playTime = this.charge = this.shake = this.hurt = this.missFlash = this.aim = 0;
    this.maxHp = this.hp = DIFF[diff].hp;
    this.setPhase("playing");
    this.beginWave(1);
  }

  pause(): void {
    if (this.phase === "playing") this.setPhase("paused");
  }
  resume(): void {
    if (this.phase === "paused") this.setPhase("playing");
  }
  toMenu(): void {
    if (this.phase === "paused" || this.phase === "over") this.setPhase("menu");
  }
  setPalette(p: Palette): void {
    this.pal = p;
  }

  private setPhase(p: Phase, summary?: GameSummary) {
    this.phase = p;
    this.ev.onPhase(p, summary);
  }

  // -------------------------------------------------------------------- waves

  private makeWave(n: number): WaveState {
    const boss = n % 5 === 0;
    return {
      n,
      stage: "banner",
      timer: 2.2,
      toSpawn: boss ? Math.min(12, 4 + n) : Math.min(40, 5 + n * 2),
      spawnTimer: 0,
      boss,
      bossPending: boss,
      hits: 0,
      misses: 0,
      bonus: 0,
    };
  }

  private params(n: number) {
    const d = DIFF[this.diff];
    return {
      interval: Math.max(0.7, 2.2 - n * 0.08) / d.spawn,
      speed: (24 + n * 4) * d.speed,
      minLen: Math.min(7, 3 + Math.floor((n - 1) / 3)),
      maxLen: Math.min(10, 4 + Math.floor(n * 0.6)),
    };
  }

  private beginWave(n: number) {
    this.wave = this.makeWave(n);
    this.ev.onSfx("wave");
  }

  private updateWave(dt: number) {
    const w = this.wave;
    if (w.stage === "banner") {
      w.timer -= dt;
      if (w.timer <= 0) w.stage = "spawn";
    } else if (w.stage === "spawn") {
      w.spawnTimer -= dt;
      const total = w.boss ? Math.min(12, 4 + w.n) : Math.min(40, 5 + w.n * 2);
      if (w.bossPending && w.toSpawn <= Math.floor(total / 2)) {
        this.spawnBoss();
        w.bossPending = false;
      }
      if (w.spawnTimer <= 0 && w.toSpawn > 0) {
        this.spawnEnemy();
        w.toSpawn--;
        w.spawnTimer = this.params(w.n).interval * rnd(0.7, 1.3);
      }
      if (w.toSpawn <= 0 && !w.bossPending) w.stage = "clear";
    } else if (w.stage === "clear") {
      if (this.enemies.length === 0) {
        const total = w.hits + w.misses;
        const acc = total === 0 ? 1 : w.hits / total;
        w.bonus = Math.round(250 * w.n * acc);
        this.score += w.bonus;
        this.hp = Math.min(this.maxHp, this.hp + 10);
        w.stage = "done";
        w.timer = 2.4;
        this.ev.onSfx("clear");
      }
    } else if (w.stage === "done") {
      w.timer -= dt;
      if (w.timer <= 0) this.beginWave(w.n + 1);
    }
  }

  // ----------------------------------------------------------------- spawning

  private pickWord(len: number): string {
    const used = new Set(this.enemies.filter((e) => !e.doomed).map((e) => e.word[0]));
    let l = len;
    while (!gameWordsByLength[l] && l > 3) l--;
    const pool = gameWordsByLength[l] ?? gameWordsByLength[4];
    let w = pool[rint(0, pool.length - 1)];
    for (let i = 0; i < 40 && used.has(w[0]); i++) w = pool[rint(0, pool.length - 1)];
    return w;
  }

  private spawnEnemy() {
    const n = this.wave.n;
    const p = this.params(n);
    const roll = Math.random();
    let kind: Kind = "drone";
    if (n >= 3 && roll < 0.14) kind = "tank";
    else if (n >= 2 && roll < 0.34) kind = "dart";

    let len: number;
    if (kind === "dart") len = rint(3, Math.max(3, Math.min(5, p.maxLen)));
    else if (kind === "tank") len = rint(6, Math.max(7, p.maxLen));
    else len = rint(p.minLen, p.maxLen);

    const word = this.pickWord(len);
    const spec = KIND[kind];
    const amp = kind === "dart" ? 46 : kind === "drone" ? 14 : 0;
    const margin = Math.max(spec.r + 10, (word.length * 12.4 + 20) / 2 + 8) + amp;

    let x = rnd(margin, W - margin);
    for (let i = 0; i < 8; i++) {
      if (!this.enemies.some((e) => e.y < 140 && Math.abs(e.baseX - x) < 90)) break;
      x = rnd(margin, W - margin);
    }

    this.enemies.push({
      id: this.nextId++,
      kind,
      word,
      typed: 0,
      x,
      y: -spec.r,
      baseX: x,
      vy: p.speed * spec.speed,
      r: spec.r,
      age: 0,
      wob: kind === "dart" ? 2.2 : 1.4,
      amp,
      phase: rnd(0, 6.28),
      doomed: false,
      dead: false,
      pending: 0,
      flash: 0,
      dmg: spec.dmg,
      points: 0,
    });
  }

  private spawnBoss() {
    const used = new Set(this.enemies.filter((e) => !e.doomed).map((e) => e.word[0]));
    const options = bossPhrases.filter((p) => !used.has(p[0]));
    const phrase = (options.length ? options : bossPhrases)[rint(0, (options.length || bossPhrases.length) - 1)];
    const spec = KIND.boss;
    this.enemies.push({
      id: this.nextId++,
      kind: "boss",
      word: phrase,
      typed: 0,
      x: W / 2,
      y: -spec.r,
      baseX: W / 2,
      vy: this.params(this.wave.n).speed * spec.speed,
      r: spec.r,
      age: 0,
      wob: 0.6,
      amp: 120,
      phase: 0,
      doomed: false,
      dead: false,
      pending: 0,
      flash: 0,
      dmg: spec.dmg,
      points: 0,
    });
    this.ev.onSfx("shock");
  }

  // -------------------------------------------------------------------- input

  key(k: string): void {
    if (this.phase !== "playing") return;
    if (k === "Enter") {
      if (this.charge >= 100) this.shockwave();
      return;
    }
    if (k.length !== 1 || this.enemies.length === 0) return;
    const ch = k.toLowerCase();

    let t = this.target;
    if (!t) {
      let best: Enemy | null = null;
      for (const e of this.enemies) {
        if (!e.doomed && e.y > 0 && e.word[0] === ch && (!best || e.y > best.y)) best = e;
      }
      if (!best) return this.miss();
      t = best;
      this.target = best;
    }
    if (t.word[t.typed] === ch) this.hit(t);
    else this.miss();
  }

  private mult() {
    return Math.min(8, 1 + Math.floor(this.combo / 10));
  }

  private hit(e: Enemy) {
    e.typed++;
    this.correct++;
    this.wave.hits++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const mult = this.mult();
    this.score += 10 * mult;
    e.pending++;
    const a = this.aim;
    this.bullets.push({ x: SHIP_X + Math.sin(a) * 30, y: SHIP_Y - Math.cos(a) * 30, dx: 0, dy: -1, target: e });
    this.ev.onSfx("laser", this.combo);

    if (e.typed >= e.word.length) {
      e.doomed = true;
      e.points = Math.round(e.word.length * KIND[e.kind].pts * mult);
      this.kills++;
      this.target = null;
      const before = this.charge;
      this.charge = Math.min(100, this.charge + (e.kind === "boss" ? 40 : e.kind === "tank" ? 14 : 9));
      if (before < 100 && this.charge >= 100) this.ev.onSfx("ready");
    }
  }

  private miss() {
    this.misses++;
    this.wave.misses++;
    this.combo = 0;
    this.shake = Math.max(this.shake, 4);
    this.missFlash = 0.25;
    this.ev.onSfx("miss");
  }

  private shockwave() {
    this.charge = 0;
    this.ev.onSfx("shock");
    this.shake = 16;
    this.ring(SHIP_X, SHIP_Y, 900, this.pal.accent, 0.7);
    for (const e of [...this.enemies]) {
      if (e.kind === "boss") {
        e.y = Math.max(-e.r, e.y - 150);
        e.flash = 0.35;
      } else {
        this.score += e.word.length * 8;
        this.explode(e, false);
      }
    }
  }

  // --------------------------------------------------------------- simulation

  update(rawDt: number): void {
    const dt = Math.min(rawDt, 0.05);
    if (this.phase === "paused") return;
    this.t += dt;

    for (const s of this.stars) {
      s.y += (10 + s.z * 50) * dt;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }
    this.updateFx(dt);
    if (this.phase !== "playing") return;

    this.playTime += dt;
    this.updateWave(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);

    const want = this.target ? clamp(Math.atan2(this.target.x - SHIP_X, SHIP_Y - this.target.y), -1.2, 1.2) : 0;
    this.aim += (want - this.aim) * Math.min(1, dt * 14);
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.age += dt;
      e.y += e.vy * dt;
      if (e.amp) e.x = clamp(e.baseX + Math.sin(e.age * e.wob + e.phase) * e.amp, e.r + 4, W - e.r - 4);
      if (e.flash > 0) e.flash -= dt;
      if (e.y + e.r >= SHIP_Y - 18) {
        this.explode(e, false);
        this.damage(e.dmg);
        if (this.phase !== "playing") return;
      }
    }
  }

  private updateBullets(dt: number) {
    const step = BULLET_SPEED * dt;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.target.dead) {
        this.bullets.splice(i, 1);
        continue;
      }
      const dx = b.target.x - b.x;
      const dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      b.dx = dx / d;
      b.dy = dy / d;
      if (d <= step + b.target.r * 0.7) {
        this.bullets.splice(i, 1);
        this.bulletLanded(b.target);
      } else {
        b.x += b.dx * step;
        b.y += b.dy * step;
      }
    }
  }

  private bulletLanded(e: Enemy) {
    e.pending--;
    e.flash = 0.1;
    this.sparks(e.x, e.y, 5, KIND[e.kind].color, 180, 0.35);
    this.ev.onSfx("hit");
    if (e.doomed && e.pending <= 0) this.explode(e, true);
  }

  private explode(e: Enemy, award: boolean) {
    if (e.dead) return;
    e.dead = true;
    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (this.target === e) this.target = null;
    const big = e.kind === "boss" || e.kind === "tank";
    const col = KIND[e.kind].color;
    this.sparks(e.x, e.y, big ? 46 : 22, col, big ? 380 : 260, big ? 1 : 0.7);
    this.sparks(e.x, e.y, 8, "#ffffff", 200, 0.4);
    this.ring(e.x, e.y, e.r * (big ? 4 : 3), col, 0.45);
    this.shake = Math.max(this.shake, big ? 12 : 3);
    this.ev.onSfx(e.kind === "boss" ? "boom" : "explode");
    if (award && e.points > 0) {
      this.score += e.points;
      this.floats.push({ x: e.x, y: e.y - e.r, text: `+${e.points}`, life: 1, max: 1, color: this.pal.accent });
    }
  }

  private damage(n: number) {
    this.hp -= n;
    this.combo = 0;
    this.shake = 18;
    this.hurt = 0.5;
    this.ev.onSfx("damage");
    this.floats.push({ x: SHIP_X, y: SHIP_Y - 50, text: `-${n}`, life: 1.1, max: 1.1, color: this.pal.error });
    if (this.hp <= 0) this.gameOver();
  }

  private gameOver() {
    this.hp = 0;
    this.sparks(SHIP_X, SHIP_Y, 60, this.pal.accent, 420, 1.2);
    this.ring(SHIP_X, SHIP_Y, 300, this.pal.accent, 0.8);
    this.ev.onSfx("over");
    const total = this.correct + this.misses;
    this.setPhase("over", {
      score: Math.round(this.score),
      wave: this.wave.n,
      kills: this.kills,
      accuracy: total === 0 ? 100 : Math.round((this.correct / total) * 100),
      wpm: this.playTime > 0 ? Math.round((this.correct / 5 / (this.playTime / 60)) * 10) / 10 : 0,
      maxCombo: this.maxCombo,
      difficulty: this.diff,
      seconds: Math.round(this.playTime),
      timestamp: Date.now(),
    });
  }

  private sparks(x: number, y: number, n: number, color: string, speed: number, life: number) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const s = speed * rnd(0.3, 1.2);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rnd(0.5, 1.2), max: life, size: rnd(1.5, 4), color, ring: false });
    }
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
  }

  private ring(x: number, y: number, maxR: number, color: string, life: number) {
    this.parts.push({ x, y, vx: 0, vy: 0, life, max: life, size: maxR, color, ring: true });
  }

  private updateFx(dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.8 * dt;
      p.vy *= 1 - 1.8 * dt;
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y -= 36 * dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
    this.shake = Math.max(0, this.shake - 40 * dt);
    this.hurt = Math.max(0, this.hurt - dt);
    this.missFlash = Math.max(0, this.missFlash - dt);
  }

  // ---------------------------------------------------------------- rendering

  /** The caller sets the world transform (1 unit = 1 logical px of the 1000x640 field). */
  render(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#05060d");
    g.addColorStop(1, "#0c0e1f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(SHIP_X, H, 20, SHIP_X, H, 520);
    glow.addColorStop(0, hexA(this.pal.accent, 0.1));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    ctx.fillStyle = "#cfd8ff";
    for (const s of this.stars) {
      ctx.globalAlpha = 0.2 + s.z * 0.6;
      const sz = 1 + s.z * 1.6;
      ctx.fillRect(s.x, s.y, sz, sz);
    }
    ctx.globalAlpha = 1;

    const playing = this.phase === "playing" || this.phase === "paused";
    if (this.target && playing) {
      ctx.strokeStyle = hexA(this.pal.accent, 0.28);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(SHIP_X, SHIP_Y - 20);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
    }

    for (const e of this.enemies) this.drawEnemy(ctx, e);
    for (const e of this.enemies) this.drawLabel(ctx, e);
    this.drawBullets(ctx);
    if (this.phase !== "over") this.drawShip(ctx);
    this.drawParticles(ctx);
    ctx.restore();

    if (this.hurt > 0 || this.missFlash > 0) {
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, hexA(this.pal.error, Math.min(0.55, this.hurt * 0.9 + this.missFlash * 0.5)));
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }

    if (playing || this.phase === "over") {
      this.drawHud(ctx);
      this.drawBanner(ctx);
    }
  }

  private drawShip(ctx: CanvasRenderingContext2D) {
    const acc = this.hurt > 0 && Math.floor(this.t * 30) % 2 === 0 ? this.pal.error : this.pal.accent;
    ctx.save();
    ctx.translate(SHIP_X, SHIP_Y);
    ctx.rotate(this.aim);
    const flame = 12 + Math.random() * 10;
    ctx.fillStyle = "rgba(255, 170, 60, 0.85)";
    ctx.beginPath();
    ctx.moveTo(-6, 12);
    ctx.lineTo(6, 12);
    ctx.lineTo(0, 12 + flame);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = acc;
    ctx.shadowBlur = 16;
    ctx.fillStyle = hexA(acc, 0.2);
    ctx.strokeStyle = acc;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(22, 18);
    ctx.lineTo(0, 8);
    ctx.lineTo(-22, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(5, 2);
    ctx.lineTo(-5, 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    const col = KIND[e.kind].color;
    const r = e.r;
    const flash = e.flash > 0;
    const spin = this.t * 0.8 + e.id;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.shadowColor = col;
    ctx.shadowBlur = flash ? 28 : 12;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.strokeStyle = flash ? "#ffffff" : col;
    ctx.fillStyle = flash ? "rgba(255,255,255,0.5)" : hexA(col, e.doomed ? 0.35 : 0.16);

    ctx.beginPath();
    if (e.kind === "drone") poly(ctx, 6, r, spin);
    else if (e.kind === "tank") poly(ctx, 8, r, Math.PI / 8);
    else if (e.kind === "boss") poly(ctx, 12, r, spin * 0.3);
    else {
      ctx.moveTo(0, r * 1.35);
      ctx.lineTo(-r * 0.95, -r);
      ctx.lineTo(0, -r * 0.45);
      ctx.lineTo(r * 0.95, -r);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(col, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (e.kind === "drone") {
      ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
      for (const s of [-1, 1]) {
        ctx.moveTo(s * r, 0);
        ctx.lineTo(s * r * 1.5, r * 0.45);
      }
    } else if (e.kind === "dart") {
      ctx.moveTo(0, -r * 0.45);
      ctx.lineTo(0, r * 0.6);
    } else if (e.kind === "tank") {
      ctx.rect(-r * 0.42, -r * 0.42, r * 0.84, r * 0.84);
      ctx.moveTo(0, r * 0.42);
      ctx.lineTo(0, r * 1.05);
    } else {
      poly(ctx, 3, r * 0.6, -spin);
    }
    ctx.stroke();

    if (e.kind === "boss") {
      ctx.save();
      ctx.setLineDash([8, 10]);
      ctx.lineDashOffset = -this.t * 25;
      ctx.beginPath();
      ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.18 + 0.04 * Math.sin(this.t * 5)), 0, Math.PI * 2);
      ctx.fill();
    }

    if (e === this.target) {
      ctx.save();
      ctx.strokeStyle = this.pal.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.t * 40;
      ctx.beginPath();
      ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawLabel(ctx: CanvasRenderingContext2D, e: Enemy) {
    if (e.y < 0) return;
    const fs = e.kind === "boss" ? 22 : 20;
    ctx.font = `700 ${fs}px ${MONO}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const upper = e.word.toUpperCase();
    const done = upper.slice(0, e.typed);
    const rest = upper.slice(e.typed);
    const wDone = ctx.measureText(done).width;
    const total = wDone + ctx.measureText(rest).width;
    const padX = 9;
    const h = fs + 12;
    const bx = clamp(e.x - total / 2 - padX, 4, W - total - padX * 2 - 4);
    const by = e.y + e.r + 10;
    const locked = e === this.target;

    rr(ctx, bx, by, total + padX * 2, h, 7);
    ctx.fillStyle = "rgba(4, 6, 16, 0.8)";
    ctx.fill();
    ctx.strokeStyle = locked ? this.pal.accent : hexA(KIND[e.kind].color, 0.5);
    ctx.lineWidth = locked ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = this.pal.accent;
    ctx.fillText(done, bx + padX, by + h / 2 + 1);
    ctx.fillStyle = e.doomed ? "#64748b" : "#f1f5ff";
    ctx.fillText(rest, bx + padX + wDone, by + h / 2 + 1);
  }

  private drawBullets(ctx: CanvasRenderingContext2D) {
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.shadowColor = this.pal.accent;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "#ffffff";
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.moveTo(b.x - b.dx * 38, b.y - b.dy * 38);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.parts) {
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = Math.min(1, k * 1.2);
      if (p.ring) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - k), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 18px ${MONO}`;
    for (const f of this.floats) {
      ctx.globalAlpha = Math.min(1, (f.life / f.max) * 1.6);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawHud(ctx: CanvasRenderingContext2D) {
    const total = this.correct + this.misses;
    const acc = total === 0 ? 100 : Math.round((this.correct / total) * 100);
    const wpm = this.playTime > 3 ? Math.round(this.correct / 5 / (this.playTime / 60)) : 0;
    ctx.save();
    ctx.textBaseline = "top";

    ctx.textAlign = "left";
    ctx.font = `600 12px ${MONO}`;
    ctx.fillStyle = "#8b93b8";
    ctx.fillText("SCORE", 20, 16);
    ctx.font = `700 30px ${MONO}`;
    ctx.fillStyle = "#f1f5ff";
    ctx.fillText(Math.round(this.score).toLocaleString(), 20, 32);
    ctx.font = `600 13px ${MONO}`;
    ctx.fillStyle = "#8b93b8";
    ctx.fillText(`${wpm} WPM · ${acc}% ACC`, 20, 70);

    ctx.textAlign = "center";
    ctx.font = `700 16px ${MONO}`;
    ctx.fillStyle = this.pal.accent;
    ctx.fillText(`WAVE ${this.wave.n}${this.wave.boss ? " · BOSS" : ""}`, W / 2, 18);

    const ratio = Math.max(0, this.hp / this.maxHp);
    const low = ratio <= 0.25;
    const barColor = ratio > 0.5 ? "#4ade80" : ratio > 0.25 ? "#fbbf24" : "#f87171";
    ctx.textAlign = "right";
    ctx.font = `600 12px ${MONO}`;
    ctx.fillStyle = "#8b93b8";
    ctx.fillText("HULL", W - 20, 16);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    rr(ctx, W - 240, 34, 220, 12, 6);
    ctx.fill();
    ctx.globalAlpha = low ? 0.55 + 0.45 * Math.sin(this.t * 10) : 1;
    ctx.fillStyle = barColor;
    if (ratio > 0) {
      rr(ctx, W - 240, 34, Math.max(12, 220 * ratio), 12, 6);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    if (this.combo > 0) {
      const mult = this.mult();
      ctx.font = `700 ${22 + Math.min(mult, 8)}px ${MONO}`;
      ctx.fillStyle = mult > 1 ? this.pal.accent : "#f1f5ff";
      ctx.fillText(`×${mult}`, 20, H - 38);
      ctx.font = `600 12px ${MONO}`;
      ctx.fillStyle = "#8b93b8";
      ctx.fillText(`COMBO ${this.combo}`, 20, H - 16);
    }

    ctx.textAlign = "right";
    const ready = this.charge >= 100;
    ctx.font = `600 12px ${MONO}`;
    ctx.fillStyle = ready ? this.pal.accent : "#8b93b8";
    ctx.globalAlpha = ready ? 0.6 + 0.4 * Math.sin(this.t * 8) : 1;
    ctx.fillText(ready ? "SHOCKWAVE READY · PRESS ENTER" : "SHOCKWAVE", W - 20, H - 32);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    rr(ctx, W - 240, H - 24, 220, 8, 4);
    ctx.fill();
    ctx.fillStyle = this.pal.accent;
    if (this.charge > 0) {
      rr(ctx, W - 240, H - 24, Math.max(8, 2.2 * this.charge), 8, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBanner(ctx: CanvasRenderingContext2D) {
    const w = this.wave;
    if (this.phase !== "playing" || (w.stage !== "banner" && w.stage !== "done")) return;
    const span = w.stage === "banner" ? 2.2 : 2.4;
    const alpha = Math.max(0, Math.min(1, w.timer / 0.5, (span - w.timer) / 0.4));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (w.stage === "banner") {
      ctx.font = `800 60px ${MONO}`;
      ctx.fillStyle = "#f1f5ff";
      ctx.fillText(`WAVE ${w.n}`, W / 2, H * 0.36);
      ctx.font = `600 18px ${MONO}`;
      ctx.fillStyle = w.boss ? this.pal.error : this.pal.accent;
      const sub = w.boss ? "BOSS INCOMING" : w.n === 1 ? "type a ship's first letter to lock on" : "";
      if (sub) ctx.fillText(sub, W / 2, H * 0.36 + 48);
    } else {
      ctx.font = `800 44px ${MONO}`;
      ctx.fillStyle = this.pal.accent;
      ctx.fillText("WAVE CLEARED", W / 2, H * 0.36);
      ctx.font = `600 18px ${MONO}`;
      ctx.fillStyle = "#f1f5ff";
      ctx.fillText(`+${w.bonus} bonus · hull +10`, W / 2, H * 0.36 + 42);
    }
    ctx.restore();
  }
}
