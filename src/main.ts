import { Application } from 'pixi.js';
import { DESIGN } from './config';
import { GameState } from './game/GameState';
import { InputManager } from './game/InputManager';
import { Scene } from './render/Scene';

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({
    background: 0x0e0f12,
    resizeTo: window,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  document.getElementById('app')?.appendChild(app.canvas);

  const scene = new Scene();
  app.stage.addChild(scene.root);

  const game = new GameState();
  const input = new InputManager(game);
  scene.bindCards(input);

  const resize = (): void => {
    const scale = Math.min(
      app.screen.width / DESIGN.width,
      app.screen.height / DESIGN.height,
    );
    scene.root.scale.set(scale);
    scene.root.position.set(
      Math.round((app.screen.width - DESIGN.width * scale) / 2),
      Math.round((app.screen.height - DESIGN.height * scale) / 2),
    );
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'KeyR') {
      game.reset();
      scene.resetFx();
    } else if (event.code === 'KeyF') {
      scene.toggleFlicker();
    } else if (event.code === 'KeyD') {
      scene.toggleDebug();
    }
  });

  const STEP = 1 / 60;
  let accumulator = 0;

  app.ticker.add((ticker) => {
    resize();
    const frameSeconds = Math.min(ticker.deltaMS / 1000, 0.1);
    accumulator += frameSeconds;

    let steps = 0;
    while (accumulator >= STEP && steps < 6) {
      input.update(STEP);
      game.update(STEP);
      accumulator -= STEP;
      steps += 1;
    }
    if (steps === 6) accumulator = 0;

    scene.render(game, input, frameSeconds);
  });
}

void bootstrap();
