export function createScoreCounter(initial = 0) {
  let score = initial;
  return {
    get: () => score,
    add: (n = 10) => (score += n),
    reset: () => (score = 0)
  };
}
export interface RuntimeState {
  levelIndex: number;
  lives: number;
  paused: boolean;
}
