import { Container, Graphics, Text } from 'pixi.js';
import { CARD_DEFS, DESIGN, FEEDBACK, GAME, LAYOUT, PLAYER_LABEL } from '../config';
import { t } from '../i18n';
import type { GameEvent, PlayerId } from '../game/types';
import type { GameState } from '../game/GameState';
import type { InputManager } from '../game/InputManager';
import { CardView } from './CardView';
import { UnitView } from './UnitView';
import { CameraShake } from './CameraShake';
import { Overlay } from './Overlay';
import { FONT_FAMILY, PALETTE, PLAYER_COLORS } from './palette';

const PLAYERS: PlayerId[] = ['p1', 'p2'];

interface BaseView {
  label: Text;
  bar: Graphics;
  flash: Graphics;
  hp: number;
  flashLife: number;
}

interface Fx {
  node: Container;
  life: number;
  max: number;
  tick: (progress: number) => void;
}

export class Scene {
  readonly root = new Container();

  private bgLayer = new Container();
  private battleLayer = new Container();
  private cardLayer = new Container();
  private uiLayer = new Container();

  private unitLayer = new Container();
  private fxLayer = new Container();
  private unitViews = new Map<number, UnitView>();
  private cards: CardView[] = [];
  private baseViews!: Record<PlayerId, BaseView>;

  private shake = new CameraShake();
  private overlay = new Overlay();
  private screenFlash = new Graphics();
  private screenFlashAlpha = 0;
  private effects: Fx[] = [];

  private flickerEnabled = true;
  private debugLabels = false;

  constructor() {
    this.root.addChild(this.bgLayer, this.battleLayer, this.cardLayer, this.uiLayer);
    this.buildBackground();
    this.buildBattle();
    this.buildCards();
    this.buildUi();
  }

  bindCards(input: InputManager): void {
    for (const card of this.cards) input.bindCard(card, card.owner, card.slot);
  }

  toggleFlicker(): void {
    this.flickerEnabled = !this.flickerEnabled;
  }

  toggleDebug(): void {
    this.debugLabels = !this.debugLabels;
  }

  resetFx(): void {
    this.shake.reset();
    this.screenFlashAlpha = 0;
    for (const fx of this.effects) fx.node.destroy();
    this.effects = [];
    for (const player of PLAYERS) {
      this.baseViews[player].flashLife = 0;
      this.baseViews[player].flash.alpha = 0;
    }
  }

  render(game: GameState, input: InputManager, dt: number): void {
    const offset = this.shake.update(dt);
    this.battleLayer.position.set(offset.x, offset.y);

    const charges = new Map<string, number>();
    for (const charge of input.getCharges()) {
      charges.set(`${charge.owner}:${charge.slot}`, charge.progress);
    }
    const flicker = this.flickerEnabled && game.phase !== 'gameover';
    for (const card of this.cards) {
      card.update(dt, charges.get(`${card.owner}:${card.slot}`) ?? 0, flicker, this.debugLabels);
    }

    this.syncUnits(game);
    for (const player of PLAYERS) this.updateBase(player, game, dt);
    this.updateEffects(dt);

    this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - FEEDBACK.screenFlashDecay * dt);
    this.screenFlash.alpha = this.screenFlashAlpha;

    for (const event of game.drainEvents()) {
      this.handleEvent(event);
      if (event.type === 'spawn') {
        input.cancelPlayer(event.owner);
        this.shuffleCards(event.owner);
      }
    }

    this.overlay.update(game);
  }

  private buildBackground(): void {
    const bg = new Graphics().rect(0, 0, DESIGN.width, DESIGN.height).fill(PALETTE.bg);
    this.bgLayer.addChild(bg);
  }

  private buildBattle(): void {
    const mountains = new Graphics();
    mountains
      .moveTo(340, 330)
      .lineTo(470, 128)
      .lineTo(600, 330)
      .stroke({ width: 2, color: PALETTE.mountain, alpha: 0.85 });
    mountains
      .moveTo(560, 330)
      .lineTo(690, 92)
      .lineTo(820, 330)
      .stroke({ width: 2, color: PALETTE.mountain, alpha: 0.85 });
    this.battleLayer.addChild(mountains);

    const lane = new Graphics()
      .moveTo(LAYOUT.laneLeft, LAYOUT.laneY)
      .lineTo(LAYOUT.laneRight, LAYOUT.laneY)
      .stroke({ width: 1, color: PALETTE.lane, alpha: 0.65 });
    lane
      .moveTo(LAYOUT.laneLeft, LAYOUT.laneY - 6)
      .lineTo(LAYOUT.laneLeft, LAYOUT.laneY + 6)
      .stroke({ width: 1, color: PALETTE.line, alpha: 0.45 });
    lane
      .moveTo(LAYOUT.laneRight, LAYOUT.laneY - 6)
      .lineTo(LAYOUT.laneRight, LAYOUT.laneY + 6)
      .stroke({ width: 1, color: PALETTE.line, alpha: 0.45 });
    this.battleLayer.addChild(lane);

    this.baseViews = {} as Record<PlayerId, BaseView>;
    for (const player of PLAYERS) {
      const box = LAYOUT.base[player];
      const plate = new Graphics()
        .roundRect(box.x, box.y, box.w, box.h, 12)
        .fill({ color: PALETTE.panel, alpha: 0.7 })
        .stroke({ width: 1, color: PALETTE.line, alpha: 0.55 });

      const flash = new Graphics()
        .roundRect(box.x, box.y, box.w, box.h, 12)
        .fill({ color: PALETTE.white, alpha: 0.25 });
      flash.alpha = 0;

      const label = new Text({
        text: '',
        style: { fontFamily: FONT_FAMILY, fontSize: 15, fill: PALETTE.text, letterSpacing: 1 },
      });
      label.anchor.set(0.5, 0.5);
      label.position.set(box.x + box.w / 2, box.y - 40);

      const bar = new Graphics();
      bar.position.set(box.x, box.y - 22);

      this.battleLayer.addChild(plate, flash, label, bar);
      this.baseViews[player] = { label, bar, flash, hp: -1, flashLife: 0 };
    }

    this.battleLayer.addChild(this.unitLayer, this.fxLayer);
  }

  private buildCards(): void {
    for (const player of PLAYERS) {
      const xs = LAYOUT.card.xs[player];
      for (let slot = 0; slot < 3; slot++) {
        const def = CARD_DEFS[player][slot];
        const card = new CardView(player, slot, def, xs[slot], LAYOUT.card.y);
        this.cards.push(card);
        this.cardLayer.addChild(card);
      }
    }
  }

  private buildUi(): void {
    this.screenFlash
      .rect(0, 0, DESIGN.width, DESIGN.height)
      .fill({ color: PALETTE.white, alpha: 1 });
    this.screenFlash.alpha = 0;
    this.uiLayer.addChild(this.screenFlash, this.overlay.root);
  }

  private syncUnits(game: GameState): void {
    for (const unit of game.units) {
      let view = this.unitViews.get(unit.id);
      if (!view) {
        view = new UnitView(unit);
        this.unitViews.set(unit.id, view);
        this.unitLayer.addChild(view);
      }
      view.sync(unit);
    }

    const alive = new Set(game.units.map((unit) => unit.id));
    for (const [id, view] of this.unitViews) {
      if (!alive.has(id)) {
        view.destroy();
        this.unitViews.delete(id);
      }
    }
  }

  private updateBase(player: PlayerId, game: GameState, dt: number): void {
    const view = this.baseViews[player];
    if (view.hp !== game.bases[player]) {
      view.hp = game.bases[player];
      view.label.text = t('baseLabel', { player: PLAYER_LABEL[player], hp: view.hp });

      const width = LAYOUT.base[player].w;
      const ratio = Math.max(0, view.hp / GAME.baseHp);
      view.bar.clear();
      view.bar.roundRect(0, 0, width, 3, 1.5).fill({ color: PALETTE.line, alpha: 0.22 });
      view.bar
        .roundRect(0, 0, width * ratio, 3, 1.5)
        .fill({ color: PLAYER_COLORS[player].main, alpha: 0.9 });
    }

    view.flashLife = Math.max(0, view.flashLife - dt);
    view.flash.alpha = (view.flashLife / 0.18) * 0.35;
  }

  private shuffleCards(player: PlayerId): void {
    const views = this.cards.filter((card) => card.owner === player);
    const positions = this.shuffle([...LAYOUT.card.xs[player]]);
    const frequencies = this.shuffle(CARD_DEFS[player].map((def) => def.freq));

    if (positions.every((x, i) => x === views[i].position.x)) {
      [positions[0], positions[1]] = [positions[1], positions[0]];
    }
    if (frequencies.every((freq, i) => freq === views[i].frequency)) {
      [frequencies[0], frequencies[1]] = [frequencies[1], frequencies[0]];
    }

    for (let i = 0; i < views.length; i++) {
      views[i].position.x = positions[i];
      views[i].setFrequency(frequencies[i]);
    }
  }

  private shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  private handleEvent(event: GameEvent): void {
    switch (event.type) {
      case 'spawn': {
        this.shake.add(FEEDBACK.trauma.spawn);
        const card = this.cards.find(
          (item) => item.owner === event.owner && item.slot === event.slot,
        );
        card?.flash();
        break;
      }
      case 'exchange': {
        this.shake.add(FEEDBACK.trauma.exchange);
        this.floatText(`-${event.damageA}`, event.x - 12);
        this.floatText(`-${event.damageB}`, event.x + 12);
        break;
      }
      case 'death': {
        this.shake.add(FEEDBACK.trauma.death);
        this.spawnRing(event.x, PLAYER_COLORS[event.owner].bright);
        break;
      }
      case 'baseHit': {
        this.shake.add(FEEDBACK.trauma.baseHit);
        this.baseViews[event.target].flashLife = 0.18;
        this.screenFlashAlpha = FEEDBACK.screenFlash.baseHit;
        this.floatText(`-${event.amount}`, event.x);
        break;
      }
      case 'baseDestroyed': {
        this.shake.add(FEEDBACK.trauma.baseDestroyed);
        this.screenFlashAlpha = FEEDBACK.screenFlash.baseDestroyed;
        break;
      }
      case 'gameOver':
        break;
    }
  }

  private updateEffects(dt: number): void {
    const alive: Fx[] = [];
    for (const fx of this.effects) {
      fx.life -= dt;
      if (fx.life > 0) {
        fx.tick(1 - fx.life / fx.max);
        alive.push(fx);
      } else {
        fx.node.destroy();
      }
    }
    this.effects = alive;
  }

  private spawnRing(x: number, color: number): void {
    const ring = new Graphics().circle(0, 0, 9).stroke({ width: 2, color, alpha: 0.9 });
    ring.position.set(x, LAYOUT.laneY);
    this.fxLayer.addChild(ring);
    this.effects.push({
      node: ring,
      life: 0.35,
      max: 0.35,
      tick: (progress) => {
        ring.scale.set(0.5 + progress * 1.6);
        ring.alpha = 1 - progress;
      },
    });
  }

  private floatText(text: string, x: number): void {
    const label = new Text({
      text,
      style: { fontFamily: FONT_FAMILY, fontSize: 13, fill: PALETTE.text },
    });
    label.anchor.set(0.5);
    const y = LAYOUT.laneY - 24;
    label.position.set(x, y);
    this.fxLayer.addChild(label);
    this.effects.push({
      node: label,
      life: 0.55,
      max: 0.55,
      tick: (progress) => {
        label.y = y - progress * 26;
        label.alpha = 1 - progress;
      },
    });
  }
}
