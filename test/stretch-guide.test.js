const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { getWorkoutStretches, getAllStretches, getWarmups, getWorkoutWarmups, getHoldSeconds } = require("../stretch-guide.js");

const workout = (...names) => ({ exercises: names.map((name) => ({ name })) });

test("general warmups label suitable training areas and keep their media and data separate from daily stretches", () => {
  const items = getWarmups({ mediaEnabled: true });
  assert.deepEqual(items.map(item => item.title), ["动态扩胸", "招财猫（空手）", "徒手小幅蹲起", "站姿提踵", "扶稳踝绕环", "屈臂肩部绕环"]);
  assert.deepEqual(items[0].suitableFor, ["练胸前", "练肩前"]);
  assert.deepEqual(items[1].suitableFor, ["练胸前", "练背前", "练肩前"]);
  for (const item of items.filter(item => item.media.type !== "video")) {
    assert.match(fs.readFileSync(path.join(__dirname, "..", item.media.src)).subarray(0, 6).toString(), /^GIF8[79]a$/);
    assert.equal(fs.readFileSync(path.join(__dirname, "..", item.media.poster)).readUInt16BE(0), 0xffd8);
  }
  const legs = items.filter(item => item.suitableFor.includes("练腿前"));
  assert.equal(legs.length, 3);
  assert.ok(legs.every(item => item.repetitions && item.steps.length === 3 && item.avoid));
  assert.equal(legs[0].media.approximate, true);
  assert.match(legs[0].media.note, /小幅/);
  assert.equal(items[1].media.type, "video");
  assert.match(items[1].media.src, /^https:\/\/static1\.keepcdn\.com\//);
  assert.ok(getWarmups().every(item => item.media === null));
  assert.ok(getWorkoutStretches({ key: "push" }).every(item => !items.some(warmup => warmup.id === item.id)));
  items[0].suitableFor.push("changed"); items[0].steps[0] = "changed"; items[0].media.src = "changed";
  const again = getWarmups({ mediaEnabled: true });
  assert.deepEqual(again[0].suitableFor, ["练胸前", "练肩前"]);
  assert.notEqual(again[0].steps[0], "changed"); assert.notEqual(again[0].media.src, "changed");
});

test("warmups select the current day's regions, skip recovery and return independent data", () => {
  assert.deepEqual(getWorkoutWarmups({ key: "push" }).map(item => item.id), ["chest-opening", "shoulder-rotation"]);
  assert.deepEqual(getWorkoutWarmups({ key: "pull" }).map(item => item.id), ["shoulder-circles", "shoulder-rotation"]);
  assert.deepEqual(getWorkoutWarmups({ key: "legs" }).map(item => item.id), ["leg-squat", "calf-raise", "ankle-circles"]);
  assert.deepEqual(getWorkoutWarmups({ key: "legs", type: "recovery" }), []);
  assert.deepEqual(getWorkoutWarmups({ key: "toString" }), []);
  assert.deepEqual(getWorkoutWarmups(), []);
  const items = getWorkoutWarmups({ key: "legs" }, { mediaEnabled: true });
  items[0].steps[0] = "changed"; items[0].media.src = "changed";
  assert.notEqual(getWorkoutWarmups({ key: "legs" }, { mediaEnabled: true })[0].steps[0], "changed");
  assert.notEqual(getWorkoutWarmups({ key: "legs" }, { mediaEnabled: true })[0].media.src, "changed");
});

test("full-body days select three upper and lower body stretches without accumulating every region", () => {
  const items = getWorkoutStretches({ key: "fullbody", ...workout("标准俯卧撑", "哑铃卧推", "单臂哑铃划船", "高脚杯深蹲", "动感单车匀速骑行") });
  assert.deepEqual(items.map((item) => item.id), ["chest", "back", "quads"]);
  assert.equal(getHoldSeconds(items), 120);
  assert.ok(items.every((item) => item.seconds === 30 && item.steps.length === 3 && item.avoid));
});

test("all eight stretches have distinct demonstrations, reduced-motion posters and source credits", () => {
  const items = getAllStretches({ mediaEnabled: true });
  assert.equal(items.length, 8);
  assert.equal(new Set(items.map((item) => item.media.src)).size, 8);
  for (const item of items) {
    if (item.media.type === "video") {
      assert.equal(item.id, "quads");
      assert.match(item.media.src, /^https:\/\/static1\.keepcdn\.com\//);
      assert.match(item.media.poster, /^https:\/\/static1\.gotokeep\.com\//);
      assert.match(item.media.sourceUrl, /calorietech.com\/exercises\//);
      assert.match(item.media.attribution, /Keep/);
      continue;
    }
    const gif = fs.readFileSync(path.join(__dirname, "..", item.media.src));
    const poster = fs.readFileSync(path.join(__dirname, "..", item.media.poster));
    assert.match(gif.subarray(0, 6).toString(), /^GIF8[79]a$/);
    assert.equal(poster.readUInt16BE(0), 0xffd8);
    assert.match(item.media.attribution, /Gym visual/);
    assert.match(item.media.sourceUrl, /MrZaKaRiA\/exercises-dataset\/blob\/main\/videos\//);
  }
});

test("stretches need no floor or mat and retain the two seated chair stretches", () => {
  const items = getAllStretches({ mediaEnabled: true });
  assert.doesNotMatch(items.map(item => [item.title, item.cue, ...item.steps].join(" ")).join(" "), /躺|侧卧|仰卧|俯卧|跪|瑜伽垫|防滑垫/);
  const back = items.find(item => item.id === "back");
  const quads = items.find(item => item.id === "quads");
  assert.match(back.steps[0], /站稳/);
  assert.equal(back.media.src, "exercise-media/1365-GSDioYu.gif");
  assert.match(quads.steps[0], /椅背/);
  assert.match(quads.media.sourceUrl, /55cc42d20f11ec78824999d9/);
  assert.ok(items.every(item => !/1346-f38OEuO|0613-BWnJR72/.test(item.media.src)));
  assert.deepEqual(items.filter(item => ["hamstrings", "glutes"].includes(item.id)).map(item => item.title), ["坐姿腿后侧拉伸", "坐姿搭腿拉臀"]);
});

test("stretch media stays off by default and enabled media cannot mutate future results", () => {
  assert.ok(getAllStretches().every((item) => item.media === null));
  assert.ok(getWorkoutStretches(workout("标准俯卧撑"), { mediaEnabled: false }).every((item) => item.media === null));
  const item = getAllStretches({ mediaEnabled: true })[0];
  item.media.src = "changed";
  item.steps[0] = "changed";
  assert.notEqual(getAllStretches({ mediaEnabled: true })[0].media.src, "changed");
  assert.notEqual(getAllStretches({ mediaEnabled: true })[0].steps[0], "changed");
});

test("stretches use only the exercises in the selected workout without changing its plan", () => {
  const day = workout("跑步机快走");
  const original = JSON.stringify(day);
  assert.deepEqual(getWorkoutStretches(day).map((item) => item.id), ["hamstrings", "calves"]);
  assert.equal(JSON.stringify(day), original);
  assert.deepEqual(getWorkoutStretches(workout("标准俯卧撑")).map((item) => item.id), ["chest", "shoulder"]);
});

test("planned movements match their own regions while recovery days have no stretch prescription", () => {
  assert.deepEqual(getWorkoutStretches(workout("俯身飞鸟")).map((item) => item.id), ["shoulder"]);
  assert.deepEqual(getWorkoutStretches(workout("夹胸 / 飞鸟")).map((item) => item.id), ["chest", "shoulder"]);
  assert.equal(getWorkoutStretches(workout("全身拉伸")).length, 3);
  assert.deepEqual(getWorkoutStretches(workout("臀腿拉伸")).map((item) => item.id), ["hamstrings"]);
  assert.deepEqual(getWorkoutStretches({ type: "recovery", ...workout("跑步机快走", "全身拉伸") }), []);
});

test("new arm and glute stretches have bilateral holds and unknown plans still return at most three matches", () => {
  const push = getWorkoutStretches({ key: "push" });
  assert.deepEqual(push.map((item) => item.id), ["chest", "shoulder", "triceps"]);
  assert.equal(getHoldSeconds(push), 150);
  const legs = getWorkoutStretches({ key: "legs" });
  assert.deepEqual(legs.map((item) => item.id), ["quads", "hamstrings", "glutes"]);
  assert.equal(getHoldSeconds(legs), 180);
  const fallback = getWorkoutStretches({ key: "new-plan", ...workout("卧推", "下拉", "绳索下压", "深蹲", "跑步机快走") });
  assert.equal(fallback.length, 3);
  assert.equal(new Set(fallback.map((item) => item.id)).size, 3);
  assert.deepEqual(getWorkoutStretches({ key: "toString", ...workout("未知动作") }), []);
});

test("unmatched workouts return no invented target and returned instructions are isolated", () => {
  assert.deepEqual(getWorkoutStretches(), []);
  assert.deepEqual(getWorkoutStretches(workout("未知动作")), []);
  assert.equal(getHoldSeconds(), 0);
  const items = getWorkoutStretches(workout("标准俯卧撑"));
  items[0].steps[0] = "changed";
  items[0].title = "changed";
  const next = getWorkoutStretches(workout("标准俯卧撑"));
  assert.notEqual(next[0].steps[0], "changed");
  assert.notEqual(next[0].title, "changed");
});
