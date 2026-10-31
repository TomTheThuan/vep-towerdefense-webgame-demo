import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { LAYOUT, type CardDef } from '../config';
import { t } from '../i18n';
import { FONT_FAMILY, PALETTE, PLAYER_COLORS } from './palette';
import type { PlayerId } from '../game/types';

export class CardView extends Container {
  readonly owner: PlayerId;
  readonly slot: number;

  private w = LAYOUT.card.w;
  private h = LAYOUT.card.h;
  private tabH = LAYOUT.card.tabH;
  private freqValue: number;

  private onLayer: Graphics;
  private offLayer: Graphics;
  private glow = new Graphics();
  private chargeBar = new Graphics();
  private flashLayer = new Graphics();
  private freqLabel: Text;

  private t = Math.random() * 0.6;
  private flashLife = 0;

  constructor(owner: PlayerId, slot: number, def: CardDef, x: number, y: number) {
    super();
    this.owner = owner;
    this.slot = slot;
    this.freqValue = def.freq;
    this.position.set(x, y);

    const colors = PLAYER_COLORS[owner];

    const mask = new Graphics().roundRect(0, 0, this.w, this.h, 10).fill(0xffffff);
    this.addChild(mask);

    const body = new Container();
    body.mask = mask;
    this.addChild(body);

    this.offLayer = this.makeBodyLayer(PALETTE.panelDeep, 1, colors.main, 0.14);
    this.onLayer = this.makeBodyLayer(colors.main, 0.92, colors.bright, 0.2);
    body.addChild(this.offLayer, this.onLayer);

    const tab = new Graphics()
      .roundRect(0, -this.tabH, this.w, this.tabH, 8)
      .fill({ color: PALETTE.panel, alpha: 0.95 })
      .stroke({ width: 1, color: PALETTE.line, alpha: 0.35 })
      .roundRect(8, -this.tabH + 7, 4, 12, 2)
      .fill({ color: colors.main, alpha: 0.95 });

    const stat = new Text({
      text: t('stat', { hp: def.hp, damage: def.damage }),
      style: { fontFamily: FONT_FAMILY, fontSize: 13, fill: PALETTE.text },
    });
    stat.position.set(20, -this.tabH + 5);

    this.freqLabel = new Text({
      text: `${def.freq.toFixed(2)} Hz`,
      style: { fontFamily: FONT_FAMILY, fontSize: 11, fill: PALETTE.dim },
    });
    this.freqLabel.position.set(8, 8);
    this.freqLabel.visible = false;

    const frame = new Graphics()
      .roundRect(-1, -this.tabH - 1, this.w + 2, this.h + this.tabH + 2, 11)
      .stroke({ width: 1, color: PALETTE.line, alpha: 0.4 });

    this.flashLayer
      .roundRect(0, 0, this.w, this.h, 10)
      .fill({ color: PALETTE.white, alpha: 1 });
    this.flashLayer.alpha = 0;

    this.addChild(
      tab,
      stat,
      frame,
      this.glow,
      this.chargeBar,
      this.flashLayer,
      this.freqLabel,
    );

    this.hitArea = new Rectangle(0, -this.tabH, this.w, this.h + this.tabH);
  }

  get frequency(): number {
    return this.freqValue;
  }

  setFrequency(freq: number): void {
    this.freqValue = freq;
    this.freqLabel.text = `${freq.toFixed(2)} Hz`;
  }

  flash(): void {
    this.flashLife = 0.25;
  }

  update(dt: number, progress: number, flicker: boolean, debug: boolean): void {
    this.t += dt;
    const on = Math.floor(this.t * this.freqValue * 2) % 2 === 0;
    this.onLayer.visible = !flicker || on;
    this.offLayer.visible = flicker && !on;

    const p = Math.min(1, Math.max(0, progress));
    this.glow.clear();
    this.chargeBar.clear();
    if (p > 0.01) {
      const colors = PLAYER_COLORS[this.owner];
      this.glow
        .roundRect(-2, -this.tabH - 2, this.w + 4, this.h + this.tabH + 4, 12)
        .stroke({ width: 2, color: colors.bright, alpha: 0.25 + 0.6 * p });
      this.chargeBar
        .roundRect(8, this.h - 12, (this.w - 16) * p, 5, 2.5)
        .fill({ color: colors.bright, alpha: 0.9 });
    }

    this.freqLabel.visible = debug;
    this.flashLife = Math.max(0, this.flashLife - dt);
    this.flashLayer.alpha = this.flashLife * 4;
  }

  private makeBodyLayer(
    fill: number,
    fillAlpha: number,
    hatchColor: number,
    hatchAlpha: number,
  ): Graphics {
    const g = new Graphics();
    g.roundRect(0, 0, this.w, this.h, 10).fill({ color: fill, alpha: fillAlpha });
    for (let x = -this.h; x < this.w; x += 14) {
      g.moveTo(x, this.h)
        .lineTo(x + this.h, 0)
        .stroke({ width: 1, color: hatchColor, alpha: hatchAlpha });
    }
    return g;
  }
}
