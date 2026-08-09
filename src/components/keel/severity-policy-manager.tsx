"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITY_STYLES } from "@/lib/keel/format";
import { addSeverityRuleAction, removeSeverityRuleAction } from "@/lib/keel/actions";
import type { SelectorType, SeverityLevel, SeverityRuleOut } from "@/lib/keel/types";

export function SeverityPolicyManager({ initialRules }: { initialRules: SeverityRuleOut[] }) {
  const [rules, setRules] = useState(initialRules);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [selectorType, setSelectorType] = useState<SelectorType>("tag");
  const [selectorValue, setSelectorValue] = useState("");
  const [floorSeverity, setFloorSeverity] = useState<SeverityLevel>("high");
  const [label, setLabel] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {rules.length === 0 && <p className="text-sm text-muted-foreground">No severity rules configured yet.</p>}
        {rules.map((rule) => {
          const style = SEVERITY_STYLES[rule.floor_severity];
          return (
            <div key={rule.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full border px-2 py-0.5 text-xs font-medium capitalize">{rule.selector_type}</span>
                <span className="font-mono">{rule.selector_value}</span>
                <span className="text-muted-foreground">→ at least</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.bg} ${style.text}`}>
                  {rule.floor_severity}
                </span>
                {rule.label && <span className="text-xs text-muted-foreground">({rule.label})</span>}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await removeSeverityRuleAction(rule.id);
                      setRules((prev) => prev.filter((r) => r.id !== rule.id));
                      toast.success("Removed.");
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed to remove rule.");
                    }
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Selector</Label>
          <Select value={selectorType} onValueChange={(v) => typeof v === "string" && setSelectorType(v as SelectorType)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tag">Tag</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Value</Label>
          <Input
            placeholder={selectorType === "tag" ? "financial" : "Finance"}
            value={selectorValue}
            onChange={(e) => setSelectorValue(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Floor severity</Label>
          <Select value={floorSeverity} onValueChange={(v) => typeof v === "string" && setFloorSeverity(v as SeverityLevel)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Label (optional)</Label>
          <Input placeholder="Finance team" value={label} onChange={(e) => setLabel(e.target.value)} className="w-40" />
        </div>
        <Button
          disabled={pending || !selectorValue.trim()}
          onClick={() =>
            startTransition(async () => {
              try {
                const created = await addSeverityRuleAction({
                  selector_type: selectorType,
                  selector_value: selectorValue.trim(),
                  floor_severity: floorSeverity,
                  label: label.trim() || undefined,
                });
                setRules((prev) => [...prev, created]);
                setSelectorValue("");
                setLabel("");
                toast.success("Severity rule added.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to add rule.");
              }
            })
          }
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
