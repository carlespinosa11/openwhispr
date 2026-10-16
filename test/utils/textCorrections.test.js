const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseTextCorrections,
  applyTextCorrections,
  getCorrectionTargets,
} = require("../../src/utils/textCorrections.ts");
const { getDictionaryHintWords } = require("../../src/utils/snippets.ts");

test("parses rules with several misheard forms and any arrow", () => {
  assert.deepEqual(parseTextCorrections(["capcode, cap code => Claude Code", "gleto -> Cifrato"]), [
    { from: ["capcode", "cap code"], to: "Claude Code" },
    { from: ["gleto"], to: "Cifrato" },
  ]);
  assert.deepEqual(parseTextCorrections(["sin flecha", " => vacío", "x =>  ", 42]), []);
});

test("replaces regardless of case, spacing, hyphens and accents", () => {
  const rules = ["cap code => Claude Code"];
  for (const heard of ["CapCode", "cap code", "Cap-Code", "cáp code", "CAPCODE"]) {
    assert.equal(
      applyTextCorrections(`GPT, ${heard}, si necesita Canva`, rules),
      "GPT, Claude Code, si necesita Canva",
      `expected "${heard}" to be corrected`
    );
  }
  assert.equal(
    applyTextCorrections("La exógena vence", ["exogena => exógena"]),
    "La exógena vence"
  );
});

test("never matches inside a longer word", () => {
  assert.equal(
    applyTextCorrections("Fueron a la meta final", ["eta => ETA"]),
    "Fueron a la meta final"
  );
});

test("longest rule wins and replacements happen in one pass", () => {
  const rules = ["fill out => Fillout", "fill out forms => Fillout Forms", "Fillout => NO"];
  assert.equal(
    applyTextCorrections("Usa fill out forms y fill out.", rules),
    "Usa Fillout Forms y Fillout."
  );
});

test("targets feed the dictionary hints, misheard forms do not", () => {
  const lines = ["capcode => Claude Code", "gleto => Cifrato"];
  assert.deepEqual(getCorrectionTargets(lines), ["Claude Code", "Cifrato"]);
  assert.deepEqual(
    getDictionaryHintWords({ customDictionary: ["Cifrato", "HubSpot"], textCorrections: lines }),
    ["Cifrato", "HubSpot", "Claude Code"]
  );
});
