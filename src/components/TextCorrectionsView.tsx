import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PAGE_CONTENT_WIDTH_CLASS } from "./ui/pageWidth";
import { cn } from "./lib/utils";
import { useSettings } from "../hooks/useSettings";
import { parseTextCorrections } from "../utils/textCorrections";
import { CLEANUP_SKIP_OPTIONS } from "../utils/quickDictation";

export default function TextCorrectionsView() {
  const { t } = useTranslation();
  const {
    textCorrections,
    setTextCorrections,
    cleanupAppContext,
    setCleanupAppContext,
    cleanupSkipMaxWords,
    setCleanupSkipMaxWords,
  } = useSettings();
  const saved = textCorrections.join("\n");
  const [draft, setDraft] = useState(saved);

  useEffect(() => setDraft(saved), [saved]);

  const lines = useMemo(
    () =>
      draft
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [draft]
  );
  const validCount = parseTextCorrections(lines).length;
  const invalidCount = lines.length - validCount;

  return (
    <div className={cn(PAGE_CONTENT_WIDTH_CLASS, "flex flex-col gap-4 px-6 py-5")}>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-medium text-foreground">{t("dictionary.corrections.title")}</h3>
        <p className="text-xs text-foreground/55">{t("dictionary.corrections.description")}</p>
      </div>

      <div className="rounded-md border border-border px-3 pt-2.5 pb-2">
        <Textarea
          dir="auto"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("dictionary.corrections.placeholder")}
          rows={10}
          className="min-h-[180px] resize-y border-0 shadow-none rounded-none bg-transparent p-0 font-mono text-xs text-foreground placeholder:text-foreground/40 hover:border-0 focus:border-0 focus:ring-0"
        />
        <div className="flex items-center justify-between pt-1.5">
          <p className="text-xs text-foreground/45">
            {t("dictionary.corrections.count", { count: validCount })}
            {invalidCount > 0 && (
              <span className="text-destructive">
                {" • "}
                {t("dictionary.corrections.invalid", { count: invalidCount })}
              </span>
            )}
          </p>
          <Button size="sm" onClick={() => setTextCorrections(lines)} disabled={draft === saved}>
            {t("dictionary.corrections.save")}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{t("dictionary.corrections.appContext")}</span>
          <span className="text-xs text-foreground/55">
            {t("dictionary.corrections.appContextDescription")}
          </span>
        </div>
        <Toggle
          checked={cleanupAppContext}
          onChange={setCleanupAppContext}
          ariaLabel={t("dictionary.corrections.appContext")}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{t("dictionary.corrections.quickTitle")}</span>
          <span className="text-xs text-foreground/55">
            {t("dictionary.corrections.quickDescription")}
          </span>
        </div>
        <Select
          value={String(cleanupSkipMaxWords)}
          onValueChange={(value) => setCleanupSkipMaxWords(Number(value))}
        >
          <SelectTrigger
            className="h-8 w-40 shrink-0 text-xs"
            aria-label={t("dictionary.corrections.quickTitle")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLEANUP_SKIP_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n === 0
                  ? t("dictionary.corrections.quickOff")
                  : t("dictionary.corrections.quickUpTo", { count: n })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
