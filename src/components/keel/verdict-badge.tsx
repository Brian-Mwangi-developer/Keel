import { cn } from "@/lib/utils";
import { BAND_STYLES } from "@/lib/keel/format";
import type { Band, Verdict } from "@/lib/keel/types";

/**
 * IDEA.md §5.1: "a number never appears without the words that interpret
 * it." Every score anywhere in this app renders through this component —
 * color is never the only signal (band dot + numeric score + verdict text
 * all agree), so it still reads correctly for anyone who can't rely on
 * color alone.
 */
export function VerdictBadge({
  score,
  band,
  verdict,
  size = "default",
  className,
}: {
  score: number;
  band: Band;
  verdict: Verdict;
  size?: "default" | "sm";
  className?: string;
}) {
  const style = BAND_STYLES[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1.5 font-medium whitespace-nowrap",
        style.bg,
        style.text,
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      <span className="font-mono tabular-nums">{score}</span>
      <span className="opacity-80">{verdict}</span>
    </span>
  );
}

export function ScoreDot({ band, className }: { band: Band; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", BAND_STYLES[band].dot, className)} />;
}
