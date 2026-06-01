# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

「健身小助手」(gym_excise) — a single-page, pure-frontend fitness coaching website aimed at evening-training beginners. No backend, no accounts, no build step. Deployed as static files to GitHub Pages (https://flyyang12-rgb.github.io/gym_excise_plus/). UI copy is Chinese; keep new user-facing strings in Chinese to match.

## Running / developing

- **Preview:** open `index.html` directly in a browser, or serve the folder (e.g. `python -m http.server 8080` then open `http://localhost:8080/index.html`). There is no build, no bundler, no lint, and no test suite.
- **Cache busting:** `index.html` references `style.css?v=...` and `script.js?v=...` with a version query string. When you change CSS/JS and need the browser to pick it up, bump the `?v=` token in `index.html` (currently `v=20260524-12`).
- **Deploy:** push to `main`; GitHub Pages serves it. Note the repo is typically pushed through a local proxy (`git -c http.proxy=http://127.0.0.1:7897 push origin main`).

## Architecture

Three files do everything: `index.html` (static shell + element IDs), `style.css` (theming via CSS custom properties on `:root`), `script.js` (all data + logic). There is no module system — `script.js` is one IIFE-style top-level script that runs `init()` at the bottom.

**Data-driven design.** All workout content lives as plain config objects at the top of `script.js`; the rendering functions only read from them. To change exercises, plans, equipment, or copy, edit these objects rather than the render code:

- `goalConfig` — per-goal labels, durations, coach tips, recovery/nutrition text.
- `equipmentLibrary` — equipment cards (image, uses, plain-language instructions); keyed IDs (`treadmill`, `cable`, `mat`, …) map to files in `images/`.
- `tutorialLinks` — exercise-name → external tutorial URL (only used for `muscleGain`).
- `planTemplates` / `fatLossPlanTemplates` — weekly schedules keyed by frequency (`3`/`4`/`5`), each entry referencing a workout `key`.
- `workoutLibrary` (muscleGain) / `fatLossWorkouts` (fatLoss) — the actual workout definitions (title, warmup, `exercises[]` with `name`/`sets`/`note`/`stance`/`grip`/`firstMove`/`equipment`).

**Two parallel content sets switched by `state.goal`.** `muscleGain` uses `workoutLibrary` + `planTemplates` + gym `equipmentLibrary` entries + `tutorialLinks`; `fatLoss` uses `fatLossWorkouts` + `fatLossPlanTemplates` and forces everything to the `mat` (瑜伽垫) equipment with no tutorial links. `cloneWorkout()` / `getPlanByFrequency()` pick the right set. When adding a feature, remember to handle both goals.

**State & rendering flow.** A single `state` object (`{ heightCm, weightKg, workStart/EndTime, goal, trainDaysPerWeek }`) plus module-level `activeDayId`. UI events update `state`, then call `rerenderAll()`, which fans out to the `render*` functions (`renderOverview`, `renderProfileCalendar`, `renderWeeklyPlan`, `renderWorkout`, `renderEquipmentGuide`, …). Rendering is full-innerHTML replacement; event handlers are re-bound after each render (`bindWorkoutInteractions`, `bindEquipmentJumpButtons`). DOM is reached via the `elements` lookup map built once at startup.

**Persistence.** Only daily check-in progress is persisted, to `localStorage` under `STORAGE_KEY = "fitness_helper_progress_v2"`, shaped as `{ "YYYY-MM-DD": { [workoutId]: { [exerciseName]: true } } }`. Profile inputs (height/weight/goal/etc.) are **not** persisted — they reset to `defaultState` on reload. `workoutId` is composed in `getPlanByFrequency` as `${day}-${key}-${index}`.

**Notable interactions.** "看器械/看瑜伽垫" buttons scroll to the matching `#equipment-<key>` card and briefly highlight it (`bindEquipmentJumpButtons`), saving scroll position for the floating "返回动作" button. The "AI 系统观察" dock button opens the BMI modal (`#bmiModal`), whose "应用到当前页面" writes height/weight back into `state`.
