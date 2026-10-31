import { Container, Graphics } from 'pixi.js';
import { GAME, LAYOUT } from '../config';
import { PLAYER_COLORS } from './palette';
import type { PlayerId, Unit } from '../game/types';

export class UnitView extends Container {
  private body = new Graphics();
  private pips = new Graphics();
  private owner: PlayerId;
  private lastHp = -1;

  constructor(unit: Unit) {
    super();
    this.owner = unit.owner;
    const colors = PLAYER_COLORS[unit.owner];
    this.body
      .roundRect(-GAME.unitW / 2, -GAME.unitH / 2, GAME.unitW, GAME.unitH, 4)
      .fill({ color: colors.main, alpha: 0.95 })
      .stroke({ width: 2, color: colors.bright, alpha: 0.85 });
    this.addChild(this.body, this.pips);
  }

  sync(unit: Unit): void {
    this.position.set(unit.x, LAYOUT.laneY);
    if (unit.hp !== this.lastHp) {
      this.lastHp = unit.hp;
      this.drawPips(unit.maxHp, unit.hp);
    }
  }

  private drawPips(max: number, hp: number): void {
    const colors = PLAYER_COLORS[this.owner];
    const totalWidth = max * 6 - 2;
    this.pips.clear();
    for (let i = 0; i < max; i++) {
      const x = -totalWidth / 2 + i * 6;
      this.pips
        .roundRect(x, -GAME.unitH / 2 - 10, 4, 4, 1)
        .fill({ color: i < hp ? colors.bright : colors.dark, alpha: 0.9 });
    }
  }
}
