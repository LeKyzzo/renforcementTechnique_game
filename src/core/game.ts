import { clamp, rand } from "../utils/index";
import type { Player, Car, LevelConfig, GameConfig } from "./types";
import { createScoreCounter, type RuntimeState } from "./state";

export class Game {
  cfg: GameConfig;
  levels: LevelConfig[];
  level: LevelConfig;
  player: Player;
  cars: Car[] = [];
  keys = new Set<string>();
  last = 0;
  running = false;
  updateHUD: (level: number, score: number, lives: number) => void;
  state: RuntimeState = { levelIndex: 0, paused: false, lives: 3 };
  score = createScoreCounter(0);

  // gestion des effets visuels (flash, overlay)
  private flashUntil = 0;         
  private flashMs = 0;             
  private overlayText: string | null = null; // texte overlay ("NIVEAU SUIVANT" ou "GAME OVER")
  private overlayUntil = 0;       
  private autoPause = false;       // pause gérée par le jeu (indépendante de la barre espace)
  private overlayCallback: (() => void) | null = null;

  constructor(cfg: GameConfig, levels: LevelConfig[], updateHUD: Game["updateHUD"]) {
    this.cfg = cfg;
    this.levels = levels.length ? levels : [{ id:1, lanes:5, speed:2, carsPerLane:2 }];
    this.level = this.levels[0];
    this.updateHUD = updateHUD;
    const { canvas } = cfg;
    // position de départ du joueur
    this.player = { x: canvas.width/2, y: canvas.height - cfg.laneHeight/2, size: 20, speed: 4, alive: true };
    this.spawnLevel();   
    this.bindInputs();  
    this.loop = this.loop.bind(this);
  }

  // config des touches
  bindInputs() {
    addEventListener("keydown", e => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
      if (e.key === " ") {
        // on ignore le toggle pendant une auto-pause d’overlay
        if (!this.autoPause) this.state.paused = !this.state.paused;
      }
      this.keys.add(e.key);
    });
    addEventListener("keyup", e => this.keys.delete(e.key));
  }

  // Genere les voitures
  spawnLevel() {
    const { laneHeight, canvas } = this.cfg;
    this.cars = [];
    for (let lane = 0; lane < this.level.lanes; lane++) {
      const dir = lane % 2 === 0 ? 1 : -1;
      for (let i = 0; i < this.level.carsPerLane; i++) {
        const w = rand(50, 90);
        const h = laneHeight * 0.6;
        const y = canvas.height - laneHeight * (lane + 1.5);
        const x = dir === 1 ? rand(-canvas.width, canvas.width) : rand(0, canvas.width * 2);
        const speed = this.level.speed * (0.8 + Math.random() * 0.4) * dir;
        this.cars.push({ x, y, w, h, speed, dir: dir as 1|-1, lane, color: `hsl(${Math.floor(rand(0,360))}deg 80% 60%)` });
      }
    }
    this.player.x = canvas.width/2;
    this.player.y = canvas.height - laneHeight/2;
  }

  // lance le jeu et la boucle d'animation
  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }
  stop() { this.running = false; }

  // boucle principale
  loop(t: number) {
    if (!this.running) return;
    const dt = Math.min(32, t - this.last) / 16.666;
    this.last = t;

    // fin d’un overlay auto-pause ?
    if (this.autoPause && t >= this.overlayUntil) {
      this.autoPause = false;
      this.state.paused = false;
      this.overlayText = null;
      this.overlayUntil = 0;
      const cb = this.overlayCallback;
      this.overlayCallback = null;
      if (cb) cb();
    }

    if (!this.state.paused) this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }

  // logique de jeu 
  update(dt: number) {
    const { canvas, laneHeight } = this.cfg;
    const p = this.player;
    const step = p.speed * (this.keys.has("Shift") ? 1.8 : 1);
    if (this.keys.has("ArrowLeft"))  p.x -= step;
    if (this.keys.has("ArrowRight")) p.x += step;
    if (this.keys.has("ArrowUp"))    p.y -= step;
    if (this.keys.has("ArrowDown"))  p.y += step;
    p.x = clamp(p.x, p.size, canvas.width - p.size);
    p.y = clamp(p.y, p.size, canvas.height - p.size);

    for (const c of this.cars) {
      c.x += c.speed * dt * 2;
      if (c.dir === 1 && c.x - c.w/2 > canvas.width + 20) c.x = -Math.random() * canvas.width * 0.5;
      if (c.dir === -1 && c.x + c.w/2 < -20) c.x = canvas.width + Math.random() * canvas.width * 0.5;
    }

    for (const c of this.cars) {
      if (Math.abs(p.x - c.x) < (p.size + c.w/2) * 0.8 && Math.abs(p.y - c.y) < (p.size + c.h/2) * 0.8) {
        this.hit();
        break;
      }
    }

    if (p.y < laneHeight * 0.5) {
      this.score.add(100);
      this.nextLevel(); // cette méthode affiche aussi l’overlay "NIVEAU SUIVANT"
    }

    this.updateHUD(this.level.id, this.score.get(), this.state.lives);
  }

  // quand le joueur touche une voiture
  hit() {
    this.state.lives -= 1;
    this.flash(180); 

    if (this.state.lives <= 0) {
      // overlay "GAME OVER", puis reset dans le callback
      this.pauseWithMessage("GAME OVER", 1400, () => {
        this.gameOver();
      });
    } else {
      const { canvas, laneHeight } = this.cfg;
      this.player.x = canvas.width/2;
      this.player.y = canvas.height - laneHeight/2;
    }
  }

  // niveau suivant (avec petite pause + message)
  nextLevel() {
    this.state.lives = Math.min(5, this.state.lives + 1);
    this.state.levelIndex = (this.state.levelIndex + 1) % this.levels.length;
    this.level = this.levels[this.state.levelIndex];
    this.spawnLevel();

    this.pauseWithMessage("NIVEAU SUIVANT", 900);
  }

  // reset du jeu
  gameOver() {
    this.state.lives = 3;
    this.score.reset();
    this.state.levelIndex = 0;
    this.level = this.levels[0];
    this.spawnLevel();
  }

  // interface de jeu
  draw() {
    const { ctx, canvas, laneHeight } = this.cfg;
    const now = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // dessine la route
    for (let i = 0; i < Math.ceil(canvas.height / laneHeight); i++) {
      ctx.fillStyle = i % 2 === 0 ? "#0f172a" : "#0b1220";
      ctx.fillRect(0, canvas.height - (i+1)*laneHeight, canvas.width, laneHeight);
    }
    // lignes des voies
    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.lineWidth = 2;
    for (let i = 1; i < this.level.lanes + 1; i++) {
      const y = canvas.height - i * laneHeight;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // voitures
    for (const c of this.cars) {
      ctx.fillStyle = c.color || "#94a3b8";
      ctx.fillRect(c.x - c.w/2, c.y - c.h/2, c.w, c.h);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(c.dir===1 ? c.x + c.w/2 - 6 : c.x - c.w/2, c.y - 6, 6, 12);
    }
    // joueur
    const p = this.player;
    ctx.fillStyle = "#fde68a";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size/1.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#f97316";
    ctx.beginPath(); ctx.moveTo(p.x + 6, p.y); ctx.lineTo(p.x + 16, p.y - 4); ctx.lineTo(p.x + 16, p.y + 4); ctx.closePath(); ctx.fill();

    // flash rouge quand on meurt
    if (this.flashUntil > now && this.flashMs > 0) {
      const a = (this.flashUntil - now) / this.flashMs; // 1 -> 0
      ctx.fillStyle = `rgba(239,68,68,${Math.max(0, Math.min(1, a))*0.5})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    // overlay texte (niveau suivant, game over)
    if (this.overlayText) {
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "24px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(this.overlayText, canvas.width/2, canvas.height/2);
    }

    // mode pause manuel
    if (this.state.paused && !this.autoPause) {
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "24px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("PAUSE", canvas.width/2, canvas.height/2);
    }
  }

  // flash rouge quand on meurt
  flash(ms: number) {
    this.flashMs = ms;
    this.flashUntil = performance.now() + ms;
  }

  // petite pause avec overlay + callback optionnel à la fin
  private pauseWithMessage(text: string, ms: number, onEnd?: () => void) {
    this.overlayText = text;
    this.overlayUntil = performance.now() + ms;
    this.autoPause = true;
    this.state.paused = true;
    this.overlayCallback = onEnd || null;
  }
}
