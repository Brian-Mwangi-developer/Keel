"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { approveIncidentAction, denyIncidentAction } from "@/lib/keel/actions";

export function IncidentDecision({ incidentId }: { incidentId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-4">
      <span className="mr-auto text-sm font-medium">
        A human decides every resolution — Keel&apos;s agent never applies this on its own.
      </span>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await denyIncidentAction(incidentId);
              toast.info("Denied — no action taken.");
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to deny.");
            }
          })
        }
      >
        <X className="size-4" />
        Deny
      </Button>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await approveIncidentAction(incidentId);
              toast.success(`Approved — ${result.actions?.length ?? 0} action(s) applied.`);
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to approve.");
            }
          })
        }
      >
        <Check className="size-4" />
        {pending ? "Applying…" : "Approve"}
      </Button>
    </div>
  );
}
