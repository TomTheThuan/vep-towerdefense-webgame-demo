import { CARD_DEFS, GAME, LAYOUT, BONUS_SLOT } from '../config';
import type { GameEvent, Phase, PlayerId, Unit } from './types';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export class GameState {
  phase: Phase = 'countdown';
  countdown: number = GAME.countdown;
  bases: Record<PlayerId, number> = { p1: GAME.baseHp, p2: GAME.baseHp };
  units: Unit[] = [];
  winner: PlayerId | null = null;
  idleTime: Record<PlayerId, number> = { p1: 0, p2: 0 };

  private events: GameEvent[] = [];
  private nextId = 1;

  reset(): void {
    this.phase = 'countdown';
    this.countdown = GAME.countdown;
    this.bases = { p1: GAME.baseHp, p2: GAME.baseHp };
    this.units = [];
    this.winner = null;
    this.events = [];
    this.nextId = 1;
    this.idleTime = { p1: 0, p2: 0 };
  }

  /** 距离该玩家上一次出兵是否已超过挂机阈值，增援色块据此显示 */
  bonusReady(owner: PlayerId): boolean {
    return this.idleTime[owner] >= GAME.bonusIdle;
  }

  spawn(owner: PlayerId, slot: number): boolean {
    if (this.phase !== 'playing') return false;
    const def = CARD_DEFS[owner][slot];
    if (!def) return false;

    this.idleTime[owner] = 0;
    const unit: Unit = {
      id: this.nextId++,
      owner,
      x: LAYOUT.spawnX[owner],
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      attackCd: 0,
    };
    this.units.push(unit);
    this.events.push({ type: 'spawn', owner, slot, unitId: unit.id });
    return true;
  }

  /** 挂机 20 秒后的增援：5HP / 1DMG 单位 */
  spawnBonus(owner: PlayerId): boolean {
    if (this.phase !== 'playing') return false;
    if (!this.bonusReady(owner)) return false;

    this.idleTime[owner] = 0;
    const unit: Unit = {
      id: this.nextId++,
      owner,
      x: LAYOUT.spawnX[owner],
      hp: GAME.bonusHp,
      maxHp: GAME.bonusHp,
      damage: GAME.bonusDamage,
      attackCd: 0,
    };
    this.units.push(unit);
    this.events.push({
      type: 'spawn',
      owner,
      slot: BONUS_SLOT,
      unitId: unit.id,
      bonus: true,
    });
    return true;
  }

  update(dt: number): void {
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.phase = 'playing';
      }
      return;
    }
    if (this.phase !== 'playing') return;

    this.idleTime.p1 += dt;
    this.idleTime.p2 += dt;

    for (const unit of this.units) {
      unit.attackCd = Math.max(0, unit.attackCd - dt);
    }

    // 前进；前方有敌方单位时停住等待交换
    for (const unit of this.units) {
      const dir = unit.owner === 'p1' ? 1 : -1;
      const blocked = this.units.some(
        (other) =>
          other.owner !== unit.owner &&
          (dir > 0
            ? other.x >= unit.x && other.x - unit.x <= GAME.engageRange
            : other.x <= unit.x && unit.x - other.x <= GAME.engageRange),
      );
      if (!blocked) unit.x += dir * GAME.unitSpeed * dt;
    }

    // 对撞交换
    for (let i = 0; i < this.units.length; i++) {
      for (let j = i + 1; j < this.units.length; j++) {
        const a = this.units[i];
        const b = this.units[j];
        if (a.owner === b.owner) continue;
        if (Math.abs(a.x - b.x) > GAME.engageRange) continue;
        if (a.attackCd > 0 || b.attackCd > 0) continue;

        const damageToA = b.damage;
        const damageToB = a.damage;
        a.hp -= damageToA;
        b.hp -= damageToB;
        a.attackCd = GAME.exchangeInterval;
        b.attackCd = GAME.exchangeInterval;

        a.x = clamp(a.x - (a.owner === 'p1' ? 1 : -1) * GAME.knockback, LAYOUT.laneLeft, LAYOUT.laneRight);
        b.x = clamp(b.x - (b.owner === 'p1' ? 1 : -1) * GAME.knockback, LAYOUT.laneLeft, LAYOUT.laneRight);

        this.events.push({
          type: 'exchange',
          unitIds: [a.id, b.id],
          x: (a.x + b.x) / 2,
          damageA: damageToA,
          damageB: damageToB,
        });
      }
    }

    // 阵亡
    for (const unit of this.units) {
      if (unit.hp <= 0) {
        this.events.push({ type: 'death', unitId: unit.id, owner: unit.owner, x: unit.x });
      }
    }
    this.units = this.units.filter((unit) => unit.hp > 0);

    // 攻城：打一下就消失
    const survivors: Unit[] = [];
    for (const unit of this.units) {
      if (this.phase !== 'playing') {
        survivors.push(unit);
        continue;
      }
      const reached =
        unit.owner === 'p1' ? unit.x >= LAYOUT.damageLineX.p2 : unit.x <= LAYOUT.damageLineX.p1;
      if (!reached) {
        survivors.push(unit);
        continue;
      }

      const target: PlayerId = unit.owner === 'p1' ? 'p2' : 'p1';
      this.bases[target] = Math.max(0, this.bases[target] - unit.damage);
      this.events.push({
        type: 'baseHit',
        target,
        x: unit.x,
        amount: unit.damage,
        hpLeft: this.bases[target],
      });

      if (this.bases[target] <= 0) {
        this.events.push({ type: 'baseDestroyed', target });
        this.phase = 'gameover';
        this.winner = target === 'p1' ? 'p2' : 'p1';
        this.events.push({ type: 'gameOver', winner: this.winner });
      }
    }
    this.units = survivors;
  }

  drainEvents(): GameEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }
}
