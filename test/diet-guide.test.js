const assert = require("node:assert/strict");
const test = require("node:test");

const { getDietGuide } = require("../diet-guide.js");

test("returns five practical meal periods for muscle gain", () => {
  const guide = getDietGuide("muscleGain");
  assert.equal(guide.label, "增肌");
  assert.equal(guide.periods.length, 5);
  assert.deepEqual(guide.periods.map((item) => item.key), ["breakfast", "lunch", "preWorkout", "postWorkout", "snack"]);
  guide.periods.forEach((item) => assert.ok(item.options.length >= 2));
});

test("returns a distinct fat loss guide and defaults safely", () => {
  const fatLoss = getDietGuide("fatLoss");
  const fallback = getDietGuide("unknown");
  assert.equal(fatLoss.label, "减脂");
  assert.match(fatLoss.principles.join(""), /蛋白质/);
  assert.equal(fallback.label, "增肌");
});
