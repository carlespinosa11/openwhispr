const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  normalizeHotwords,
  supportsHotwords,
  buildHotwordArgs,
} = require("../../src/helpers/sherpaHotwords.js");

test("keeps casing, dedupes and strips reserved characters", () => {
  assert.deepEqual(
    normalizeHotwords(["Cifrato", "cifrato", " Claude   Code ", "a:b#c", "", 7, "x".repeat(80)]),
    ["Cifrato", "Claude Code", "a b c"]
  );
  assert.deepEqual(normalizeHotwords(null), []);
});

test("only offline NeMo transducers with a BPE vocab support hotwords", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hotwords-"));
  const base = { runtime: "offline", sherpaModelType: "nemo_transducer", modelDir: dir };
  assert.equal(supportsHotwords(base), false);
  fs.writeFileSync(path.join(dir, "bpe.vocab"), "");
  assert.equal(supportsHotwords(base), true);
  assert.equal(supportsHotwords({ ...base, runtime: "online" }), false);
  assert.equal(supportsHotwords({ ...base, sherpaModelType: null }), false);
});

test("writes the hotwords file and switches to modified beam search", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hotwords-"));
  assert.deepEqual(buildHotwordArgs([], dir, dir), []);
  const args = buildHotwordArgs(["Cifrato", "Higgsfield"], "/models/orukeet", dir);
  assert.ok(args.includes("--decoding-method=modified_beam_search"));
  assert.ok(args.includes("--bpe-vocab=/models/orukeet/bpe.vocab"));
  const fileArg = args.find((a) => a.startsWith("--hotwords-file="));
  assert.equal(fs.readFileSync(fileArg.split("=")[1], "utf8"), "Cifrato\nHiggsfield\n");
});
