const assert = require("node:assert/strict");
const test = require("node:test");

const {
  adjustRestDuration,
  getRemainingRestSeconds,
  getExerciseGuide,
  getNextExerciseIndex,
  normalizeExerciseName,
} = require("../exercise-guides.js");

test("adjusts rest duration in 15 second steps within safe bounds", () => {
  assert.equal(adjustRestDuration(60, -15), 45);
  assert.equal(adjustRestDuration(15, -15), 15);
  assert.equal(adjustRestDuration(180, 15), 180);
});

test("derives remaining rest time from an absolute end timestamp", () => {
  assert.equal(getRemainingRestSeconds(70_000, 10_000), 60);
  assert.equal(getRemainingRestSeconds(10_001, 10_000), 1);
  assert.equal(getRemainingRestSeconds(9_999, 10_000), 0);
});

test("normalizes combined workout labels to one primary exercise", () => {
  assert.equal(normalizeExerciseName("卷腹 / 平板支撑"), "仰卧卷腹");
  assert.equal(normalizeExerciseName("俯卧撑或器械推胸"), "跪姿俯卧撑");
  assert.equal(normalizeExerciseName("二头或三头补强"), "哑铃弯举");
  assert.equal(normalizeExerciseName("椭圆机或单车"), "单车");
});

test("maps common strength exercises to verified dataset media", () => {
  const expected = {
    "单臂哑铃划船": "0292-C0MA9bC.gif",
    "侧平举": "0334-DsgkuIt.gif",
    "俯身飞鸟": "0383-EAs3xL9.gif",
    "哑铃弯举": "0294-NbVPDMW.gif",
    "哑铃卧推": "0289-SpYC0Kp.gif",
    "平板卧推": "0025-EIeI8Vf.gif",
    "绳索下压": "0201-3ZflifB.gif",
    "哑铃推肩": "0405-znQUdHY.gif",
    "平板支撑交替抬手": "3699-yRpV5TC.gif",
    "单车冲刺": "2138-H1PESYI.gif",
    "弓步蹲": "3470-kMzUs9Y.gif",
    "箭步蹲": "0336-RRWFUcw.gif",
    "夹胸 / 飞鸟": "0188-xLYSdtg.gif",
  };
  Object.entries(expected).forEach(([name, file]) => {
    assert.match(getExerciseGuide({ name }, { mediaEnabled: true }).media.src, new RegExp(`${file}$`));
  });
});

test("returns a complete fallback guide for an unmatched exercise", () => {
  const guide = getExerciseGuide({ name: "自定义动作", note: "保持稳定。" }, { mediaEnabled: true });
  assert.equal(guide.hasSpecificGuide, false);
  assert.equal(guide.media, null);
  assert.ok(guide.steps.length >= 3);
  assert.ok(guide.mistakes.length >= 2);
  assert.ok(guide.alternative);
});

test("keeps licensed media disabled until the feature flag is enabled", () => {
  const disabled = getExerciseGuide({ name: "登山跑" }, { mediaEnabled: false });
  const enabled = getExerciseGuide({ name: "登山跑" }, { mediaEnabled: true });
  assert.equal(disabled.media, null);
  assert.match(enabled.media.src, /0630-RJgzwny\.gif$/);
  assert.equal(enabled.media.attribution, "© Gym visual");
});

test("marks near-match media as an approximate demonstration", () => {
  const guide = getExerciseGuide({ name: "猫牛式" }, { mediaEnabled: true });
  assert.match(guide.media.src, /1363-JbC2iaV\.gif$/);
  assert.equal(guide.media.approximate, true);
});

test("does not wrap to the first exercise after the final exercise", () => {
  assert.equal(getNextExerciseIndex(0, 4), 1);
  assert.equal(getNextExerciseIndex(3, 4), 3);
});
