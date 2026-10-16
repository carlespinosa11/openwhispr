// Short dictations ("ok, ya voy", "gracias") rarely need an AI cleanup pass,
// and that round trip is the slowest part of a local dictation. Below the
// user's word threshold the transcript is pasted as the speech model wrote it.

export const CLEANUP_SKIP_OPTIONS = [0, 3, 5, 8, 12] as const;

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

/** `maxWords` 0 (the default) always runs cleanup. */
export function shouldSkipCleanup(text: string, maxWords?: number | null): boolean {
  if (!maxWords || maxWords <= 0) return false;
  const words = countWords(text);
  return words > 0 && words <= maxWords;
}

/** The one fix cleanup would always make: capitalize the first letter. */
export function quickFormat(text: string): string {
  const trimmed = text.trim();
  return trimmed.replace(
    /^(\P{L}*)(\p{Ll})/u,
    (_, lead: string, first: string) => lead + first.toUpperCase()
  );
}
