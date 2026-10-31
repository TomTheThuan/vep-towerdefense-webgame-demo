import { Container, Graphics, Text } from 'pixi.js';
import { DESIGN, PLAYER_LABEL } from '../config';
import { t } from '../i18n';
import { FONT_FAMILY, PALETTE, PLAYER_COLORS } from './palette';
import type { GameState } from '../game/GameState';

export class Overlay {
  readonly root = new Container();

  private dim = new Graphics();
  private countdown: Text;
  private winner: Text;
  private restart: Text;
  private hints: Text[] = [];

  constructor() {
    this.dim
      .rect(0, 0, DESIGN.width, DESIGN.height)
      .fill({ color: 0x000000, alpha: 0.62 });
    this.dim.visible = false;

    this.countdown = new Text({
      text: '',
      style: { fontFamily: FONT_FAMILY, fontSize: 88, fill: PALETTE.text, letterSpacing: 4 },
    });
    this.countdown.anchor.set(0.5);
    this.countdown.position.set(DESIGN.width / 2, 260);

    this.winner = new Text({
      text: '',
      style: { fontFamily: FONT_FAMILY, fontSize: 52, fill: PALETTE.text, letterSpacing: 8 },
    });
    this.winner.anchor.set(0.5);
    this.winner.position.set(DESIGN.width / 2, 300);
    this.winner.visible = false;

    this.restart = new Text({
      text: t('restart'),
      style: { fontFamily: FONT_FAMILY, fontSize: 18, fill: PALETTE.dim },
    });
    this.restart.anchor.set(0.5);
    this.restart.position.set(DESIGN.width / 2, 366);
    this.restart.visible = false;

    const left = new Text({
      text: t('hintP1'),
      style: { fontFamily: FONT_FAMILY, fontSize: 13, fill: PALETTE.dim },
    });
    left.position.set(120, 654);

    const right = new Text({
      text: t('hintP2'),
      style: { fontFamily: FONT_FAMILY, fontSize: 13, fill: PALETTE.dim },
    });
    right.anchor.set(1, 0);
    right.position.set(1160, 654);

    const foot = new Text({
      text: t('footer'),
      style: { fontFamily: FONT_FAMILY, fontSize: 12, fill: PALETTE.dim },
    });
    foot.anchor.set(0.5, 0);
    foot.position.set(DESIGN.width / 2, 684);

    this.hints = [left, right, foot];
    this.root.addChild(
      this.dim,
      this.countdown,
      this.winner,
      this.restart,
      left,
      right,
      foot,
    );
  }

  update(game: GameState): void {
    const counting = game.phase === 'countdown';
    this.countdown.visible = counting;
    if (counting) {
      this.countdown.text = String(Math.max(1, Math.ceil(game.countdown)));
    }

    const over = game.phase === 'gameover' && game.winner !== null;
    this.dim.visible = over;
    this.winner.visible = over;
    this.restart.visible = over;
    for (const hint of this.hints) hint.visible = !over;

    if (over && game.winner) {
      const color = PLAYER_COLORS[game.winner].bright;
      this.winner.text = t('winner', { player: PLAYER_LABEL[game.winner] });
      this.winner.style.fill = color;
    }
  }
}
