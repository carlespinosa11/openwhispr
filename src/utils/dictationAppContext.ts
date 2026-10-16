// The app a dictation will be pasted into, so cleanup can match its style
// (a Slack message vs. an email vs. a terminal). Set for the duration of one
// dictation's processing by audioManager; read when the cleanup request is built.

export interface DictationApp {
  name?: string;
  bundleId?: string;
}

let current: DictationApp | null = null;

// Dictating from OpenWhispr's own panel says nothing about where the text goes.
const OWN_BUNDLE_ID = "com.gizmolabs.openwhispr";

export function setDictationAppContext(app: DictationApp | null | undefined): void {
  const usable = app && (app.name || app.bundleId) && app.bundleId !== OWN_BUNDLE_ID;
  current = usable ? { name: app.name, bundleId: app.bundleId } : null;
}

export function getDictationAppContext(): DictationApp | null {
  return current;
}

// Placed in the user turn, not the system prompt, so the system prompt (and
// any cache on it) stays identical across apps.
export function formatAppContextNote(app: DictationApp | null): string {
  if (!app) return "";
  const label = [app.name, app.bundleId && `(${app.bundleId})`].filter(Boolean).join(" ");
  return (
    `Context: this text will be pasted into ${label}. ` +
    "Match that app's conventions: chat apps (Slack, WhatsApp, Teams, Messages) stay short and casual; " +
    "email keeps complete sentences and paragraphs; code editors, terminals and AI assistants keep " +
    "commands, file names and technical terms verbatim. Never mention the app in the output.\n\n"
  );
}
