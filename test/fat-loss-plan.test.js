const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ExerciseGuides = require("../exercise-guides.js");

function loadPageLogic(windowOverrides = {}) {
  let now = 1_000_000;
  let nextIntervalId = 0;
  const intervals = new Map();
  const nodes = new Map();
  const checkboxes = [];
  function createNode() {
    const attributes = new Map();
    const classes = new Set();
    return {
      textContent: "", dataset: {}, style: { setProperty() {} }, addEventListener() {},
      setAttribute(key, value) { attributes.set(key, value); },
      removeAttribute(key) { attributes.delete(key); },
      getAttribute(key) { return attributes.get(key); },
      classList: { toggle(key, enabled) { if (enabled) classes.add(key); else classes.delete(key); }, contains: (key) => classes.has(key) },
    };
  }
  const stages = Array.from({ length: 3 }, (_, index) => ({ ...createNode(), dataset: { exerciseStage: String(index) } }));
  const root = {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, createNode());
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === "input[type='checkbox']") return checkboxes;
      if (selector === "[data-exercise-stage]") return stages;
      return [];
    },
  };
  class Clock extends Date { static now() { return now; } }
  const context = vm.createContext({
    Date: Clock,
    location: { hostname: "localhost" },
    document: { querySelector: () => root, querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem() {} },
    window: {
      location: { hostname: "localhost" },
      ExerciseGuides: { ...ExerciseGuides, getRemainingRestSeconds: (endAt) => ExerciseGuides.getRemainingRestSeconds(endAt, now) },
      setInterval(callback) { const id = ++nextIntervalId; intervals.set(id, callback); return id; },
      clearInterval(id) { intervals.delete(id); },
      ...windowOverrides,
    },
  });
  const source = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
  vm.runInContext(source.replace(/\binit\(\);\s*$/, ""), context);
  const run = (code) => vm.runInContext(code, context);
  return { run, advance: (ms) => { now += ms; }, intervals, nodes, checkboxes, stages };
}

function createAudioMock({ rejectResume = false, throwOnPlayback = false } = {}) {
  const stats = { contexts: 0, resumes: 0, tones: [] };
  class AudioContext {
    constructor() { stats.contexts += 1; this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
    resume() {
      stats.resumes += 1;
      if (rejectResume) return Promise.reject(new Error("blocked"));
      this.state = "running";
      return Promise.resolve();
    }
    createOscillator() {
      if (throwOnPlayback) throw new Error("audio unavailable");
      const tone = {};
      stats.tones.push(tone);
      return { frequency: { setValueAtTime(value) { tone.frequency = value; } }, connect() {}, disconnect() {}, start() {}, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  return { AudioContext, stats };
}

test("fat-loss plans have two different simple exercises each day before final cardio and keep legacy IDs", () => {
  const { run } = loadPageLogic();
  const expectedCardio = [["treadmill", 20], ["bike", 20], ["treadmill", 25], ["bike", 20], ["bike", 15]];
  for (const frequency of [3, 4, 5]) {
    const plan = JSON.parse(run(`JSON.stringify(getPlanByFrequency(${frequency}, "fatLoss"))`));
    assert.equal(plan.filter((day) => day.type === "train").length, frequency);
    const prepNames = plan.filter((day) => day.type === "train").flatMap((day) => day.exercises.slice(0, -1).map((exercise) => exercise.name));
    assert.equal(prepNames.length, frequency * 2);
    assert.equal(new Set(prepNames).size, frequency * 2, "no preparatory exercise repeats during the week");
    plan.forEach((day, index) => {
      assert.equal(day.id, `${day.day}-${day.key}-${index}`);
      assert.ok(!/瑜伽垫|垫上|开合跳|原地高抬腿|深蹲到伸展|罗马尼亚硬拉|绳索直臂下压|哑铃推肩|哑铃杯式深蹲|侧平举/.test(JSON.stringify(day)));
      const exercises = day.exercises;
      exercises.forEach((exercise) => {
        assert.ok(exercise.durationSeconds > 0);
        const guide = ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: true });
        assert.equal(guide.hasSpecificGuide, true);
        assert.ok(!/仰躺|仰卧|侧躺|侧卧|俯卧|撑地|跪姿|垫子/.test(JSON.stringify(guide.steps)));
        assert.ok(guide.media, `${exercise.name} needs a demonstration`);
        assert.ok(fs.existsSync(path.join(__dirname, "..", guide.media.src)));
        assert.match(guide.media.src, /\.gif$/);
      });
      const totalMinutes = exercises.reduce((sum, exercise) => sum + exercise.durationSeconds / 60, 0);
      assert.match(day.duration, new RegExp(`约 ${totalMinutes} 分钟`));
      if (day.type === "train") {
        assert.equal(exercises.length, 3);
        exercises.slice(0, -1).forEach((exercise) => {
          assert.ok(!exercise.timerSegments);
          if (exercise.phase === "strength") {
            assert.equal(exercise.durationSeconds, 240);
            assert.match(exercise.sets, /轻重量.*2组 × 10次/);
            assert.ok(["cable", "dumbbell"].includes(exercise.equipment));
          } else {
            assert.equal(exercise.phase, "warmup");
            assert.equal(exercise.durationSeconds, 60);
            assert.equal(exercise.equipment, undefined);
          }
        });
        const [equipment, minutes] = expectedCardio[index];
        const cardio = exercises.at(-1);
        assert.equal(cardio.phase, "cardio");
        assert.equal(cardio.equipment, equipment);
        assert.equal(cardio.durationSeconds, (minutes + 10) * 60);
        assert.deepEqual(cardio.timerSegments.map((segment) => segment.durationSeconds), [300, minutes * 60, 300]);
        assert.ok(minutes * 60 > exercises.slice(0, -1).reduce((sum, exercise) => sum + exercise.durationSeconds, 0), "formal cardio must be the main activity");
      } else {
        assert.equal(exercises.length, 1);
        assert.equal(totalMinutes, 20);
        assert.equal(exercises[0].name, "跑步机快走");
      }
    });
  }
});

test("cardio demonstrations use real local media and respect the media switch", () => {
  const { run } = loadPageLogic();
  const workouts = JSON.parse(run("JSON.stringify(fatLossWorkouts)"));
  Object.values(workouts).forEach((workout) => {
    workout.exercises.filter((exercise) => exercise.timerSegments).forEach((exercise) => {
      const guide = ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: true });
      const expectedFile = exercise.equipment === "bike" ? "2138-H1PESYI.gif"
        : exercise.name === "跑步机慢跑" ? "0684-y5p0H8a.gif" : "3666-rjiM4L3.gif";
      assert.equal(guide.media.src, `exercise-media/${expectedFile}`);
      assert.ok(fs.existsSync(path.join(__dirname, "..", guide.media.src)));
      assert.equal(guide.media.attribution, "© Gym visual");
      assert.equal(guide.media.approximate, exercise.name === "跑步机快走");
      assert.equal(ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: false }).media, null);
      assert.ok(guide.steps.length >= 3);
      assert.ok(guide.breathing && guide.alternative);
    });
  });
});

test("timer supports pause/resume, catches up after background time and never auto-completes", () => {
  const { run, advance, intervals, nodes } = loadPageLogic();
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2; toggleExerciseTimer();');
  assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1800);
  advance(12_500);
  run("toggleExerciseTimer()");
  assert.equal(run("exerciseTimerState.remaining"), 1788);
  assert.equal(intervals.size, 0);
  advance(60_000);
  assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1788);
  run("toggleExerciseTimer()");
  assert.equal(intervals.size, 1);
  advance(1_800_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(run("exerciseTimerState.remaining"), 0);
  assert.equal(intervals.size, 0);
  assert.equal(nodes.get("[data-exercise-seconds]").textContent, "00:00");
  assert.match(nodes.get("[data-exercise-timer-status]").textContent, /时间到/);
  assert.equal(run("activeExerciseIndex"), 2);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run("toggleExerciseTimer()");
  assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1800);
  run("resetExerciseStepper()");
  assert.equal(run("exerciseTimerState"), null);
  assert.equal(intervals.size, 0);
  assert.equal(run("activeExerciseIndex"), 0);
});

test("final cardio timer moves from low-speed warmup to main cardio and then cooldown", () => {
  const { run } = loadPageLogic();
  run('const cardioExercise = fatLossWorkouts.matFlow1.exercises[2];');
  assert.equal(run("getExerciseTimerStage(cardioExercise, 1800)"), "慢走热身");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 1501)"), "慢走热身");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 1500)"), "慢跑");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 301)"), "慢跑");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 300)"), "慢走放松");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 0)"), "已结束");
});

test("stage display tracks exact boundaries, phase time, pause and restart", () => {
  const { run, advance, nodes, stages } = loadPageLogic();
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2; updateExerciseTimerDisplay();');
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "热身");
  assert.equal(nodes.get("[data-exercise-timer-state]").textContent, "未开始");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /05:00/);
  assert.equal(stages[0].getAttribute("aria-current"), "step");
  run("toggleExerciseTimer()");
  advance(300_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "正式有氧");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /20:00/);
  assert.equal(nodes.get("[data-exercise-seconds]").textContent, "25:00");
  assert.equal(stages[0].classList.contains("is-done"), true);
  assert.equal(stages[0].getAttribute("aria-current"), undefined);
  assert.equal(stages[1].getAttribute("aria-current"), "step");
  run("toggleExerciseTimer()");
  advance(600_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-state]").textContent, "已暂停");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /20:00/);
  run("toggleExerciseTimer()");
  advance(1_200_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "放松");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /05:00/);
  advance(300_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "本次有氧结束");
  assert.ok(stages.every((stage) => stage.classList.contains("is-done")));
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run("toggleExerciseTimer()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "热身");
  assert.equal(nodes.get("[data-exercise-seconds]").textContent, "30:00");
  assert.ok(stages.every((stage) => !stage.classList.contains("is-done")));
  run("cancelExerciseTimer(); updateExerciseTimerDisplay();");
  assert.equal(nodes.get("[data-exercise-timer-state]").textContent, "未开始");
});

test("sound is opt-in and phase transitions alert once across pause, rerender and completion", async () => {
  const { AudioContext, stats } = createAudioMock();
  const { run, advance, nodes } = loadPageLogic({ AudioContext });
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2; toggleExerciseTimer();');
  assert.equal(stats.contexts, 0, "silent timers never initialize audio");
  await run("toggleExerciseTimerSound()");
  assert.equal(stats.contexts, 1);
  assert.equal(stats.resumes, 1);
  assert.equal(stats.tones.length, 2, "enabling previews the alert");
  assert.equal(nodes.get("[data-exercise-timer-sound]").getAttribute("aria-pressed"), "true");
  advance(300_000);
  run("updateExerciseTimerDisplay(); updateExerciseTimerDisplay(); toggleExerciseTimer();");
  assert.equal(stats.tones.length, 4, "phase change alerts once; pause is silent");
  advance(300_000);
  run("toggleExerciseTimer(); updateExerciseTimerDisplay();");
  assert.equal(stats.tones.length, 4, "resume does not repeat the phase alert");
  advance(1_200_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(stats.tones.length, 6);
  advance(300_000);
  run("updateExerciseTimerDisplay(); updateExerciseTimerDisplay();");
  assert.equal(stats.tones.length, 9, "completion has three tones and never repeats");
  run("toggleExerciseTimer()");
  assert.equal(stats.tones.length, 9, "restart is silent");
  await run("toggleExerciseTimerSound()");
  advance(300_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(stats.tones.length, 9, "muted phase transitions stay silent");
  assert.equal(nodes.get("[data-exercise-timer-sound]").getAttribute("aria-pressed"), "false");
});

test("background catch-up emits one current alert and cancelling prevents later alerts", async () => {
  const { AudioContext, stats } = createAudioMock();
  const { run, advance, intervals } = loadPageLogic({ AudioContext });
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2;');
  await run("toggleExerciseTimerSound()");
  run("toggleExerciseTimer()");
  advance(1_550_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(stats.tones.length, 4, "skip missed warmup/main alerts and only alert the current cooldown");
  run("resetExerciseStepper()");
  advance(600_000);
  assert.equal(intervals.size, 0);
  assert.equal(stats.tones.length, 4);
  run("activeExerciseIndex = 2; toggleExerciseTimer();");
  advance(1_800_000);
  run("toggleExerciseTimer()");
  assert.equal(run("exerciseTimerState.remaining"), 0, "a delayed pause click must not restart an expired timer");
  assert.equal(intervals.size, 0);
  assert.equal(stats.tones.length, 7, "expired timer only emits one completion alert");
});

test("unsupported or blocked audio cannot break the timer and playback failure falls back to visual cues", async () => {
  for (const audioMode of ["unsupported", "blocked", "playbackFailure"]) {
    const audio = createAudioMock({ rejectResume: audioMode === "blocked", throwOnPlayback: audioMode === "playbackFailure" });
    const { run, advance, nodes } = loadPageLogic(audioMode === "unsupported" ? {} : { AudioContext: audio.AudioContext });
    run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2;');
    await run("toggleExerciseTimerSound()");
    assert.equal(run("exerciseTimerSoundEnabled"), false, audioMode);
    assert.match(nodes.get("[data-exercise-timer-sound-note]").textContent, /不支持|未开启|暂不可用/);
    run("toggleExerciseTimer()");
    advance(300_000);
    run("updateExerciseTimerDisplay()");
    assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "正式有氧");
    assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1500);
  }
});

test("old removed exercise records stay stored and do not complete new cardio", () => {
  const { run } = loadPageLogic();
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; progressStore[todayKey()] = { "周一-matFlow1-0": { "原地高抬腿": true, "登山跑": true, "平板支撑": true } };');
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  assert.equal(run('progressStore[todayKey()][activeDayId]["登山跑"]'), true);
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["跑步机快走"]'), undefined);
});

test("renamed dumbbell fly keeps old completion and explicit cancellation takes priority", () => {
  const { run } = loadPageLogic();
  for (const frequency of [3, 4, 5]) {
    const plan = JSON.parse(run(`JSON.stringify(getPlanByFrequency(${frequency}, "muscleGain"))`));
    const fly = plan[0].exercises[2];
    assert.equal(fly.name, "哑铃飞鸟");
    assert.equal(fly.equipment, "dumbbell");
    assert.equal(fly.extraEquipment, "bench");
    const guide = ExerciseGuides.getExerciseGuide(fly, { mediaEnabled: true });
    assert.equal(guide.media.src, "exercise-media/0308-yz9nUhF.gif");
  }
  run('state.goal = "muscleGain"; activeDayId = "周一-push-0"; progressStore[todayKey()] = { [activeDayId]: { "夹胸 / 飞鸟": true } };');
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["哑铃飞鸟"]'), true);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 1);
  run('setExerciseCompleted(activeDayId, "哑铃飞鸟", false)');
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["哑铃飞鸟"]'), false);
  assert.equal(run('progressStore[todayKey()][activeDayId]["夹胸 / 飞鸟"]'), true);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run('setExerciseCompleted(activeDayId, "哑铃飞鸟", true)');
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 1);
  run('activeDayId = "周二-pull-1";');
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["哑铃飞鸟"]'), undefined);
});

test("checking both warmups advances straight to cardio without rest and final completion never wraps", () => {
  const { run, checkboxes, intervals } = loadPageLogic();
  let onChange;
  const checkbox = { checked: true, dataset: {}, addEventListener(type, callback) { if (type === "change") onChange = callback; } };
  checkboxes.push(checkbox);
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; renderWorkout = () => {}; renderWeeklyPlan = () => {};');
  checkbox.dataset = { workoutId: run("activeDayId"), exerciseName: run("getActiveWorkout().exercises[0].name") };
  run("bindWorkoutInteractions()");
  onChange();
  assert.equal(run("activeExerciseIndex"), 1);
  assert.equal(run("restState"), null);
  checkbox.dataset.exerciseName = run("getActiveWorkout().exercises[1].name");
  onChange();
  assert.equal(run("activeExerciseIndex"), 2);
  assert.equal(run("restState"), null);
  assert.equal(intervals.size, 0);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 2);
  checkbox.dataset.exerciseName = run("getActiveWorkout().exercises[2].name");
  onChange();
  assert.equal(run("activeExerciseIndex"), 2);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 3);
});
