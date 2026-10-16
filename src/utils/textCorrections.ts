// Text corrections: deterministic "heard → meant" replacements for words the
// speech model keeps getting wrong ("capcode" → "Claude Code"). Unlike
// snippets, the misheard form is never fed to the STT prompt or the cleanup
// dictionary — only the corrected form is, so the models are biased toward
// the right spelling instead of the wrong one.
//
// Stored as one line per rule: "capcode, cap code => Claude Code".

export interface TextCorrection {
  from: string[];
  to: string;
}

const ARROW = /\s*(?:=>|->|→)\s*/;
const MAX_FROM_LENGTH = 100;

// Each base letter also matches its accented forms, so a rule written without
// tildes ("exogena") still catches "exógena" and vice versa.
const ACCENT_CLASSES: Record<string, string> = {
  a: "aáàâäã",
  e: "eéèêë",
  i: "iíìîï",
  o: "oóòôöõ",
  u: "uúùûü",
  n: "nñ",
  c: "cç",
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function parseTextCorrections(lines?: string[] | null): TextCorrection[] {
  if (!Array.isArray(lines)) return [];
  const rules: TextCorrection[] = [];
  for (const line of lines) {
    if (typeof line !== "string") continue;
    const parts = line.split(ARROW);
    if (parts.length !== 2) continue;
    const to = parts[1].trim();
    const from = parts[0]
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0 && f.length <= MAX_FROM_LENGTH);
    if (!to || from.length === 0) continue;
    rules.push({ from, to });
  }
  return rules;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// "cap code" matches "cap code", "capcode", "Cap-Code" and "cáp code".
function toPattern(phrase: string): string {
  return [...stripAccents(phrase.toLowerCase())]
    .map((ch) => {
      if (/\s|-/.test(ch)) return "[\\s-]*";
      const cls = ACCENT_CLASSES[ch];
      return cls ? `[${cls}]` : escapeRegex(ch);
    })
    .join("")
    .replace(/(?:\[\\s-\]\*)+/g, "[\\s-]*");
}

interface CorrectionMatcher {
  regex: RegExp;
  entries: { key: string; to: string }[];
}

let cachedLines: string[] | null = null;
let cachedMatcher: CorrectionMatcher | null = null;

function buildMatcher(lines: string[]): CorrectionMatcher | null {
  const entries: { key: string; pattern: string; to: string }[] = [];
  for (const { from, to } of parseTextCorrections(lines)) {
    for (const f of from) {
      entries.push({ key: compactKey(f), pattern: toPattern(f), to });
    }
  }
  if (entries.length === 0) return null;
  // Longest first so "cap code pro" wins over "cap code".
  entries.sort((a, b) => b.key.length - a.key.length);
  const regex = new RegExp(
    `(?<=^|[\\s\\p{P}\\p{S}])(?:${entries.map((e) => `(${e.pattern})`).join("|")})(?=$|[\\s\\p{P}\\p{S}])`,
    "giu"
  );
  return { regex, entries };
}

function compactKey(value: string): string {
  return stripAccents(value.toLowerCase()).replace(/[\s-]+/g, "");
}

function getMatcher(lines?: string[] | null): CorrectionMatcher | null {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  if (lines !== cachedLines) {
    cachedLines = lines;
    cachedMatcher = buildMatcher(lines);
  }
  return cachedMatcher;
}

/** Apply every correction rule to `text` in a single pass. */
export function applyTextCorrections(text: string, lines?: string[] | null): string {
  if (!text) return text;
  const matcher = getMatcher(lines);
  if (!matcher) return text;
  return text.normalize("NFC").replace(matcher.regex, (match, ...groups) => {
    const index = groups.findIndex((g, i) => i < matcher.entries.length && g !== undefined);
    return index >= 0 ? matcher.entries[index].to : match;
  });
}

/** The corrected spellings, used as dictionary hints for STT and cleanup. */
export function getCorrectionTargets(lines?: string[] | null): string[] {
  return [...new Set(parseTextCorrections(lines).map((r) => r.to))];
}
