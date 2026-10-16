const test = require("node:test");
const assert = require("node:assert/strict");

const {
  setDictationAppContext,
  getDictationAppContext,
  formatAppContextNote,
} = require("../../src/utils/dictationAppContext.ts");
const { wrapCleanupTranscript } = require("../../src/config/prompts/index.ts");

test("cleanup request names the target app only while a context is set", () => {
  setDictationAppContext({ name: "Slack", bundleId: "com.tinyspeck.slackmacgap" });
  const wrapped = wrapCleanupTranscript("hola equipo");
  assert.match(
    wrapped,
    /^Context: this text will be pasted into Slack \(com\.tinyspeck\.slackmacgap\)\./
  );
  assert.match(wrapped, /<transcript>\nhola equipo\n<\/transcript>/);

  setDictationAppContext(null);
  assert.equal(
    wrapCleanupTranscript("hola equipo"),
    "<transcript>\nhola equipo\n</transcript>\n\nOutput only the cleaned transcript."
  );
});

test("ignores OpenWhispr itself and empty apps", () => {
  setDictationAppContext({ name: "OpenWhispr", bundleId: "com.gizmolabs.openwhispr" });
  assert.equal(getDictationAppContext(), null);
  setDictationAppContext({ name: "", bundleId: "" });
  assert.equal(getDictationAppContext(), null);
  assert.equal(formatAppContextNote(null), "");
});
