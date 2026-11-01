# Neuro Tower Defense · VEP Attention Battle

A two-player head-to-head tower defense game that translates **visual attention** into an in-game weapon. The game is designed to be controlled by a **non-invasive Brain-Computer Interface (BCI)** based on the **Steady-State Visual Evoked Potential (SSVEP / VEP)**. During development, the EEG signal is simulated by holding the mouse or a key for ~1.5 seconds — the same duration needed for a typical SSVEP classification window.

---

## 1. Non-Invasive Brain-Computer Interface (BCI)

A Brain-Computer Interface establishes a direct communication path between the brain and an external device, **bypassing the normal neuromuscular output pathways** (hands, voice, etc.). Depending on where the signal is measured, BCIs are grouped into three families:

| Type | Sensor placement | Signal quality | Risk |
|------|------------------|----------------|------|
| **Invasive** | Electrodes implanted inside the cortex | Highest (high SNR, single-unit) | Surgical risk |
| **Partially invasive** | Electrodes under the skull, outside brain tissue | High | Surgical risk |
| **Non-invasive** | Electrodes placed on the scalp (e.g. EEG) | Lower (weaker, noisier) | No surgery, low risk |

This project targets the **non-invasive, scalp-EEG** family: it is the safest and most practical option for a quick demo, at the cost of lower signal-to-noise ratio. To compensate for the weaker signal, we rely on a stimulation paradigm that produces a strong, frequency-tagged response: **SSVEP**.

---

## 2. How VEP / SSVEP works

**Visual Evoked Potential (VEP)** is the electrical response the visual cortex generates when the retina is stimulated. If the stimulus **flickers at a constant frequency** (e.g. 10 Hz), the cortex response is **entrained** at that same frequency (and its harmonics). This steady-state response is called **Steady-State VEP (SSVEP)**.

The key idea that makes SSVEP usable for control:

1. Place several stimuli on the screen, each flickering at a **distinct frequency** (e.g. 5 / 7 / 10 / 15 Hz).
2. When the user **gaze-locks and attends** to one stimulus, the corresponding frequency component appears in the EEG recorded over the visual cortex (typically Oz / O1 / O2).
3. A classifier (e.g. CCA, FFT-based, Riemannian) reads the EEG and **maps the detected frequency back to the selected stimulus**.

Because the response is stronger for a larger, higher-contrast stimulus and for a longer fixation, a typical SSVEP selection requires the user to hold attention for **0.5 – 2 s**. That is exactly why the game asks the player to "hold" a card for **1.5 s** before the unit spawns — that window models the minimum stable EEG classification window.

---

## 3. How the game connects with VEP

The whole interaction loop mirrors an SSVEP BCI pipeline:

| BCI step | In the game |
|----------|-------------|
| Stimuli flicker at known frequencies | Three cards per player flicker at distinct frequencies (configured in `CARD_DEFS`). |
| User attends to one stimulus | Player gazes at / holds one card. |
| Stable attention window | Hold for 1.5 s (`GAME.chargeTime`). |
| Classifier maps frequency → choice | (Simulated) `InputManager` turns a completed 1.5 s hold into `game.spawn(owner, slot)`. |
| Feedback | The unit spawns, the screen shakes, and the card flashes. |

A few design choices are directly motivated by SSVEP physics:

- **Frequency separation per player.** P1 and P2 live in different frequency bands so the two sides do not alias in the same EEG channel.
- **Color blocks with low saturation.** High-contrast luminance flicker is the strongest SSVEP driver; the game uses simple, large-area colored blocks rather than detailed sprites.
- **"Anti-camping" shuffle.** After every spawn, each player's three cards are **shuffled in position and in assigned flicker frequency**. This prevents a player from fixating a single screen location / frequency indefinitely — forcing continuous **spatial and spectral attention shifts**, which is more representative of real BCI use.
- **Reinforcement block after 20 s idle.** If a side does not spawn a unit for 20 s, a **large 15 Hz block** appears above that half of the screen. A larger stimulus yields a stronger SSVEP signal, so the block acts as an easier-to-select "comeback" target that produces a stronger unit (5 HP / 1 DMG).
- **1.5 s hold, no cooldown, no resources.** The only cost is **attention** — mirroring the fact that in a BCI the limited resource is sustained focus, not mana or cooldowns.

---

## 4. Gameplay

- Two bases (HP 10 each) at the left and right edges of a single horizontal lane.
- Each player has 3 cards at the bottom of their half.
- Hold a card for 1.5 s to spawn its unit (HP / DMG per card).
- Units walk toward the enemy base; opposing units block each other and exchange damage.
- A unit that reaches the enemy base deals its damage once and disappears.
- First base to 0 HP loses.

### Controls

| Action | P1 | P2 |
|--------|----|----|
| Spawn from card | Hold mouse on card, or keys `1` / `2` / `3` | Hold mouse on card, or keys `7` / `8` / `9` |
| Reinforcement (after 20 s idle) | Hold the top block, or key `4` | Hold the top block, or key `0` |
| Toggle flicker | `F` | |
| Toggle frequency labels | `D` | |
| Restart | `R` | |

### Internationalization

English is the default locale. Open `?lang=zh` for the Chinese UI.

---

## 5. Tech stack

- **Vite** + **TypeScript**
- **PixiJS v8** (2D rendering; `Application.init`, `Graphics`, `Container.mask`, event system)
- Fixed-timestep simulation (1/60 s) decoupled from rendering
- Pure-logic `GameState` separated from the render layer (`Scene`, `CardView`, `UnitView`, `BonusBlock`)
- `InputManager` abstracts the "hold 1.5 s → select" contract so it can be swapped for a real EEG classifier output

---

## 6. Running

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build
```

---

## 7. Replacing the mouse with real EEG

The only file that needs to change is `src/game/InputManager.ts`. Replace the pointer/keyboard handlers with a subscriber that reads your EEG classifier's output (e.g. a WebSocket / HTTP stream that emits the detected frequency or card index). When a 1.5 s stable classification is reached, call `game.spawn(owner, slot)` (or `game.spawnBonus(owner)` for the 15 Hz reinforcement block). The rest of the game does not need to know where the selection came from.
