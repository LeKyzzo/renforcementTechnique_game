export interface Vec2 { x: number; y: number; }
export interface Player extends Vec2 { size: number; speed: number; alive: boolean; }
export interface Car extends Vec2 { w: number; h: number; speed: number; dir: 1 | -1; lane: number; color?: string; }
export interface LevelConfig { id: number; lanes: number; speed: number; carsPerLane: number; }
export interface GameConfig { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tile: number; laneHeight: number; }
