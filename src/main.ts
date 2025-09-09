import { $, loadJSON, callWith } from "./utils/index";
import type { LevelConfig, GameConfig } from "./core/types";
import { Game } from "./core/game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const HUD = { level: $("#level")!, score: $("#score")!, lives: $("#lives")! };
function updateHUD(level: number, score: number, lives: number) {
  HUD.level.textContent = `Niveau : ${level}`;
  HUD.score.textContent = `Score : ${score}`;
  HUD.lives.textContent = `Vies : ${lives}`;
}

(async function bootstrap(){
  const levels = await loadJSON<LevelConfig[]>("./public/levels.json");
  const cfg: GameConfig = { canvas, ctx, tile: 32, laneHeight: 80 };
  const game = new Game(cfg, levels, updateHUD);

  // Démo .call : changer dynamiquement le titre via un contexte personnalisé
  callWith({ title: "🐔 La Poule qui Traverse" }, function() {
    document.title = (this as any).title;
  });

  document.getElementById("start")!.addEventListener("click", () => {
    if (!game.running) game.start();
  });
})();
