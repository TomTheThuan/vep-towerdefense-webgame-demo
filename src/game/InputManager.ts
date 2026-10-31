import { GAME } from '../config';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { GameState } from './GameState';
import type { ChargeState, PlayerId } from './types';

interface Charge {
  owner: PlayerId;
  slot: number;
  elapsed: number;
}

const KEY_BINDINGS: Record<string, [PlayerId, number]> = {
  Digit1: ['p1', 0],
  Digit2: ['p1', 1],
  Digit3: ['p1', 2],
  Digit7: ['p2', 0],
  Digit8: ['p2', 1],
  Digit9: ['p2', 2],
};

export class InputManager {
  private sources = new Map<string, Charge>();
  private activePlayerSource: Record<PlayerId, string | null> = { p1: null, p2: null };

  constructor(private game: GameState) {
    window.addEventListener('pointerup', this.handlePointerEnd);
    window.addEventListener('pointercancel', this.handlePointerEnd);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /** 将一张卡牌绑定为可长按的输入区域 */
  bindCard(container: Container, owner: PlayerId, slot: number): void {
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', (event: FederatedPointerEvent) => {
      this.start(`pointer:${event.pointerId}`, owner, slot);
    });
    container.on('pointerout', (event: FederatedPointerEvent) => {
      const key = `pointer:${event.pointerId}`;
      const source = this.sources.get(key);
      if (source && source.owner === owner && source.slot === slot) {
        this.stopSource(key);
      }
    });
  }

  update(dt: number): void {
    if (this.game.phase !== 'playing') {
      this.sources.clear();
      this.activePlayerSource = { p1: null, p2: null };
      return;
    }

    for (const source of this.sources.values()) {
      source.elapsed += dt;
      while (source.elapsed >= GAME.chargeTime) {
        source.elapsed -= GAME.chargeTime;
        this.game.spawn(source.owner, source.slot);
      }
    }
  }

  getCharges(): ChargeState[] {
    return [...this.sources.values()].map((source) => ({
      owner: source.owner,
      slot: source.slot,
      progress: source.elapsed / GAME.chargeTime,
    }));
  }

  private start(key: string, owner: PlayerId, slot: number): void {
    if (this.game.phase !== 'playing') return;
    if (this.sources.has(key)) return;

    const previous = this.activePlayerSource[owner];
    if (previous) this.sources.delete(previous);
    this.sources.set(key, { owner, slot, elapsed: 0 });
    this.activePlayerSource[owner] = key;
  }

  private stopSource(key: string): void {
    const source = this.sources.get(key);
    if (!source) return;
    this.sources.delete(key);
    if (this.activePlayerSource[source.owner] === key) {
      this.activePlayerSource[source.owner] = null;
    }
  }

  private handlePointerEnd = (event: PointerEvent): void => {
    this.stopSource(`pointer:${event.pointerId}`);
  };

  private handleBlur = (): void => {
    this.sources.clear();
    this.activePlayerSource = { p1: null, p2: null };
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const binding = KEY_BINDINGS[event.code];
    if (!binding) return;
    this.start(`key:${event.code}`, binding[0], binding[1]);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!KEY_BINDINGS[event.code]) return;
    this.stopSource(`key:${event.code}`);
  };
}
