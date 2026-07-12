# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## What this is

「健身小助手」(`gym_excise`) is a Chinese single-page fitness coaching website for evening-training beginners. The main experience is build-free HTML/CSS/JavaScript, with optional Node/serverless endpoints that proxy AI-coach requests to an OpenAI-compatible model provider. There are no accounts or database.

Keep new user-facing copy in Chinese and preserve the beginner-friendly, supportive tone.

## Running and developing

- **Static preview:** open `index.html` directly, or serve the directory with a static server. The page remains usable without a configured AI service and shows local fallback guidance when AI requests fail.
- **Full local preview:** use Node.js 20+ and run `npm start`, then open `http://localhost:5500/`. `server.js` serves the static files and `/api/ai-coach`.
- **Environment variables:** local development reads `.env`. The supported names are `DEEPSEEK_API_KEY` (also `OPENAI_API_KEY` or `AI_API_KEY`), `DEEPSEEK_BASE_URL` (also `AI_BASE_URL`), `DEEPSEEK_MODEL` (also `AI_MODEL` or `OPENAI_MODEL`), optional `ALLOWED_ORIGIN`, and optional `PORT`.
- **Cache busting:** `index.html` references `style.css?v=...` and `script.js?v=...`. Bump the relevant query token after CSS or JavaScript changes that must invalidate deployed browser caches. Do not assume both tokens are identical.
- **Tests/build:** there is no build step, linter, or automated test suite. Verify JavaScript syntax with `node --check` and exercise affected flows in a browser.
- **Deploy:** GitHub Pages serves the static frontend at <https://flyyang12-rgb.github.io/gym_excise_plus/>. The frontend uses the deployed Vercel AI endpoint when running on localhost, `127.0.0.1`, or GitHub Pages; other hosts use same-origin `/api/ai-coach`. `api/ai-coach.js` is the Node serverless entry, while `edge-functions/api/ai-coach.js` is the Pages Functions entry.
- **Push convention:** the repository is commonly pushed through `git -c http.proxy=http://127.0.0.1:7897 push origin main`.

## Architecture

The frontend still centers on three files:

- `index.html` — static shell and stable element IDs.
- `style.css` — all layout, responsive behavior, and theming through CSS custom properties.
- `script.js` — workout data, application state, rendering, persistence, and interactions. It is a single top-level script that calls `init()` at the bottom; there is no frontend module system.

AI support is split across these files:

- `server.js` — dependency-free Node HTTP server for local static files and `/api/ai-coach`.
- `ai-coach-handler.js` — shared Node request handler, prompt construction, provider call, response normalization, validation, and CORS behavior.
- `api/ai-coach.js` — thin Node serverless adapter for the shared handler.
- `edge-functions/api/ai-coach.js` — self-contained Pages Functions implementation using the Fetch API.

When changing AI behavior, keep the Node handler and edge-function implementation aligned. Never expose provider API keys in frontend code.

## Data-driven workout content

Workout content lives in plain configuration objects near the top of `script.js`. Update these objects instead of hard-coding content in render functions:

- `goalConfig` — labels, durations, coach tips, recovery, and nutrition copy per goal.
- `equipmentLibrary` — equipment cards keyed by IDs such as `treadmill`, `cable`, and `mat`; image paths map into `images/`.
- `tutorialLinks` — exercise-name to external tutorial URL mapping, used for muscle gain.
- `planTemplates` / `fatLossPlanTemplates` — weekly schedules keyed by training frequency (`3`, `4`, or `5`).
- `workoutLibrary` / `fatLossWorkouts` — workout definitions and exercise metadata.

There are two parallel content sets selected by `state.goal`. `muscleGain` uses `workoutLibrary`, `planTemplates`, gym equipment, and tutorial links. `fatLoss` uses `fatLossWorkouts`, `fatLossPlanTemplates`, and mat-based training without tutorial links. Changes to shared features must be checked against both goals.

## State and rendering

The mutable page state starts from `defaultState` and includes height, weight, work times, goal, and weekly training frequency. `activeDayId` tracks the selected workout day. UI handlers update state and call `rerenderAll()`, which performs full `innerHTML` replacement through the `render*` functions. Any handlers attached to replaced nodes must be rebound after rendering.

The AI coach receives derived page context, including the current goal, BMI/profile information, today's workout, and current exercise. Requests time out after `AI_REQUEST_TIMEOUT_MS` and fall back to local guidance if the API is unavailable.

## Persistence

The browser stores two independent datasets in `localStorage`:

- `fitness_helper_progress_v2` — daily workout completion, shaped as `{ "YYYY-MM-DD": { [workoutId]: { [exerciseName]: true } } }`.
- `fitness_helper_training_notes_v1` — training-note entries managed by `loadTrainingNotes()`, `saveTrainingNotes()`, and the training-note renderer.

Profile inputs are not persisted and reset to `defaultState` on reload. Workout IDs are composed in `getPlanByFrequency()` as `${day}-${key}-${index}`. Avoid changing storage keys or stored shapes without an explicit migration plan.

## Notable interactions

- “看器械/看瑜伽垫” buttons scroll to `#equipment-<key>`, briefly highlight the card, and enable the floating “返回动作” control.
- The AI dock opens the coaching conversation and uses current page context for questions.
- The BMI modal can apply height and weight back into the current page state.
- Training notes are created from the notes UI and persisted locally.
