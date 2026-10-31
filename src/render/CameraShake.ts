import { FEEDBACK } from '../config';

export class CameraShake {
  private trauma = 0;
  private time = 0;
  private phases = [0.4, 2.1, 3.7, 5.2];

  add(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  reset(): void {
    this.trauma = 0;
  }

  update(dt: number): { x: number; y: number } {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - FEEDBACK.traumaDecay * dt);
    const power = this.trauma * this.trauma * FEEDBACK.maxShakeOffset;
    const noise = (index: number) =>
      Math.sin(this.time * (9 + index * 2.7) + this.phases[index]);
    return {
      x: power * (0.6 * noise(0) + 0.4 * noise(1)),
      y: power * (0.6 * noise(2) + 0.4 * noise(3)),
    };
  }
}
