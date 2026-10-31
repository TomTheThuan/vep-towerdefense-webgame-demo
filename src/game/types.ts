export type PlayerId = 'p1' | 'p2';
export type Phase = 'countdown' | 'playing' | 'gameover';

export interface Unit {
  id: number;
  owner: PlayerId;
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackCd: number;
}

export interface ChargeState {
  owner: PlayerId;
  slot: number;
  progress: number;
}

export type GameEvent =
  | { type: 'spawn'; owner: PlayerId; slot: number; unitId: number; bonus?: boolean }
  | { type: 'exchange'; unitIds: [number, number]; x: number; damageA: number; damageB: number }
  | { type: 'death'; unitId: number; owner: PlayerId; x: number }
  | { type: 'baseHit'; target: PlayerId; x: number; amount: number; hpLeft: number }
  | { type: 'baseDestroyed'; target: PlayerId }
  | { type: 'gameOver'; winner: PlayerId };
