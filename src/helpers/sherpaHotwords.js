// Contextual biasing ("hotwords") for sherpa-onnx transducer models such as
// Orukeet and Parakeet. Dictionary words are written to a hotwords file and
// decoding switches to modified_beam_search, which is the only sherpa decoder
// that honours them. Encoder-decoder models (Cohere Transcribe) don't support it.

const fs = require("fs");
const path = require("path");

// Measured on Orukeet with real Spanish dictations: 1.5 recovers brand names
// ("Gleto" → "Cifrato", "Heightsfield" → "Higgsfield") without the
// hallucinated repeats that higher scores cause.
const HOTWORDS_SCORE = 1.5;
const MAX_ACTIVE_PATHS = 4;
const MAX_HOTWORDS = 300;
const MAX_HOTWORD_LENGTH = 60;

/**
 * Clean a dictionary list into hotword lines. Keeps the user's casing (the
 * BPE vocabulary is cased, so "CIFRATO" would not match "Cifrato") and drops
 * the characters sherpa's hotwords format reserves for per-line options.
 */
function normalizeHotwords(words) {
  if (!Array.isArray(words)) return [];
  const seen = new Set();
  const lines = [];
  for (const word of words) {
    if (typeof word !== "string") continue;
    const line = word
      .replace(/[:#\r\n\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!line || line.length > MAX_HOTWORD_LENGTH) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length >= MAX_HOTWORDS) break;
  }
  return lines;
}

/** Whether a model can be decoded with hotwords. */
function supportsHotwords({ runtime, sherpaModelType, modelDir }) {
  return (
    runtime === "offline" &&
    sherpaModelType === "nemo_transducer" &&
    !!modelDir &&
    fs.existsSync(path.join(modelDir, "bpe.vocab"))
  );
}

/** Extra server args for the given hotword lines, writing the hotwords file. */
function buildHotwordArgs(lines, modelDir, fileDir) {
  if (!lines.length) return [];
  const file = path.join(fileDir, "openwhispr-hotwords.txt");
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
  return [
    "--decoding-method=modified_beam_search",
    `--max-active-paths=${MAX_ACTIVE_PATHS}`,
    `--hotwords-file=${file}`,
    `--hotwords-score=${HOTWORDS_SCORE}`,
    "--modeling-unit=bpe",
    `--bpe-vocab=${path.join(modelDir, "bpe.vocab")}`,
  ];
}

module.exports = { normalizeHotwords, supportsHotwords, buildHotwordArgs, HOTWORDS_SCORE };
