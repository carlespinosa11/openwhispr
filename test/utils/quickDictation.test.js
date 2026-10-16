const test = require("node:test");
const assert = require("node:assert/strict");

const { countWords, shouldSkipCleanup, quickFormat } = require("../../src/utils/quickDictation.ts");

test("skips cleanup only for dictations at or under the threshold", () => {
  assert.equal(countWords("  ok,  ya voy "), 3);
  assert.equal(shouldSkipCleanup("ok ya voy", 3), true);
  assert.equal(shouldSkipCleanup("ok ya voy para allá", 3), false);
  assert.equal(shouldSkipCleanup("ok ya voy", 0), false);
  assert.equal(shouldSkipCleanup("ok ya voy", undefined), false);
  assert.equal(shouldSkipCleanup("   ", 5), false);
});

test("quick format capitalizes the first letter and keeps the rest", () => {
  assert.equal(quickFormat(" gracias, negro."), "Gracias, negro.");
  assert.equal(quickFormat("¿me ayudas?"), "¿Me ayudas?");
  assert.equal(quickFormat("Listo"), "Listo");
  assert.equal(quickFormat("ñapa"), "Ñapa");
});
