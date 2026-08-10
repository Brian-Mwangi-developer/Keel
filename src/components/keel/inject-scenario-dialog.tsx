"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bug } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { injectScenarioAction } from "@/lib/keel/actions";
import { listInjectScenariosLive } from "@/lib/keel/client-fetch";
import type { InjectScenarioOut } from "@/lib/keel/types";

/**
 * The demo's "break something" lever -- 3 fixed, named scenarios (not a
 * generic value-injection form; that's the separate upload/edit-and-check
 * flow). Picking one and hitting Test writes a real failing assertion
 * result to DataHub -- the dashboard's scores, lineage graph, and Activity
 * feed all change live, the same mechanism check_runner.py uses for a
 * hand-edited row, just pre-scripted for a repeatable demo run.
 */
export function InjectScenarioDialog() {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState<InjectScenarioOut[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || scenarios.length > 0) return;
    listInjectScenariosLive()
      .then((result) => {
        setScenarios(result);
        if (result.length > 0) setSelectedId(result[0].id);
      })
      .catch(() => toast.error("Failed to load scenarios."));
  }, [open, scenarios.length]);

  const selected = scenarios.find((s) => s.id === selectedId) ?? null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Bug className="size-3.5" />
        Inject bad event
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inject a bad event</DialogTitle>
          <DialogDescription>
            Writes a real failing check result to DataHub — the dashboard reacts live. Reset demo clears it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Scenario</Label>
            <Select value={selectedId} onValueChange={(v) => typeof v === "string" && setSelectedId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a scenario…" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && <p className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">{selected.description}</p>}
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !selectedId}
            onClick={() =>
              startTransition(async () => {
                try {
                  await injectScenarioAction(selectedId);
                  toast.success(`Injected: ${selected?.label ?? selectedId}`);
                  setOpen(false);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to inject scenario.");
                }
              })
            }
          >
            {pending ? "Testing…" : "Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
