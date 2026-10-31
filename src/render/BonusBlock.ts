import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { GAME, LAYOUT } from '../config';
import { t } from '../i18n';
import { FONT_FAMILY, PALETTE, PLAYER_COLORS } from './palette';
import type { PlayerId } from '../game/types';

/** 挂机 20 秒后出现的 15Hz 增援色块 */
export class BonusBlock extends Container {
  readonly owner: PlayerId;

  private w: number;
  private h: number;
  private offLayer: Graphics;
  private onLayer: Graphics;
  private chargeBar = new Graphics();
  private flashLayer = new Graphics();
  private freqLabel: Text;

  private clock = Math.random() * 0.5;
  private flashLife = 0;

  constructor(owner: PlayerId) {
    super();
    this.owner = owner;
    const box = LAYOUT.bonus[owner];
    this.w = box.w;
    this.h = box.h;
    this.position.set(box.x, box.y);

    const colors = PLAYER_COLORS[owner];

    this.offLayer = new Graphics()
      .roundRect(0, 0, this.w, this.h, 10)
      .fill({ color: PALETTE.panelDeep, alpha: 1 })
      .stroke({ width: 1, color: PALETTE.line, alpha: 0.35 });
    this.onLayer = new Graphics()
      .roundRect(0, 0, this.w, this.h, 10)
      .fill({ color: colors.main, alpha: 0.95 })
      .stroke({ width: 2, color: colors.bright, alpha: 0.6 });

    const label = new Text({
      text: t('bonusLabel'),
      style: { fontFamily: FONT_FAMILY, fontSize: 16, fill: PALETTE.text, letterSpacing: 2 },
    });
    label.anchor.set(0.5);
    label.position.set(this.w / 2, this.h / 2 - 6);

    const bonusStat = new Text({
      text: t('stat', { hp: GAME.bonusHp, damage: GAME.bonusDamage }),
      style: { fontFamily: FONT_FAMILY, fontSize: 12, fill: PALETTE.dim },
    });
    bonusStat.anchor.set(0.5);
    bonusStat.position.set(this.w / 2, this.h / 2 + 16);

    this.freqLabel = new Text({
      text: `${GAME.bonusFreq.toFixed(2)} Hz`,
      style: { fontFamily: FONT_FAMILY, fontSize: 11, fill: PALETTE.text },
    });
    this.freqLabel.position.set(10, 8);
    this.freqLabel.visible = false;

    this.flashLayer.roundRect(0, 0, this.w, this.h, 10).fill({ color: PALETTE.white, alpha: 1 });
    this.flashLayer.alpha = 0;

    this.addChild(
      this.offLayer,
      this.onLayer,
      label,
      bonusStat,
      this.chargeBar,
      this.flashLayer,
      this.freqLabel,
    );

    this.hitArea = new Rectangle(0, 0, this.w, this.h);
    this.visible = false;
  }

  flash(): void {
    this.flashLife = 0.35;
  }

  resetFlash(): void {
    this.flashLife = 0;
    this.flashLayer.alpha = 0;
    this.chargeBar.clear();
  }

  update(dt: number, progress: number, flicker: boolean, debug: boolean): void {
    this.clock += dt;
    const on = Math.floor(this.clock * GAME.bonusFreq * 2) % 2 === 0;
    this.onLayer.visible = !flicker || on;
    this.offLayer.visible = flicker && !on;

    const p = Math.min(1, Math.max(0, progress));
    this.chargeBar.clear();
    if (p > 0.01) {
      this.chargeBar
        .roundRect(12, this.h - 10, (this.w - 24) * p, 5, 2.5)
        .fill({ color: PLAYER_COLORS[this.owner].bright, alpha: 0.95 });
    }

    this.freqLabel.visible = debug;
    this.flashLife = Math.max(0, this.flashLife - dt);
    this.flashLayer.alpha = this.flashLife > 0 ? Math.min(1, this.flashLife * 4) : 0;
  }
}
