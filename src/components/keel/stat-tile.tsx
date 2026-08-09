import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  suffix,
  sublabel,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  sublabel?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  className?: string;
}) {
  const toneClass =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";

  return (
    <Card className={cn("gap-2", className)}>
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={cn("font-heading text-3xl font-semibold tabular-nums", toneClass)}>{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
      </CardContent>
    </Card>
  );
}
