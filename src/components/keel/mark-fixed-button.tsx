"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markIncidentFixedAction } from "@/lib/keel/actions";

// Deliberately separate from IncidentDecision's Approve/Deny -- approve
// only ever sends the agent's recommended notifications (see
// orchestrator.resolve_pending()). This button is the one place a human
// says "the underlying data problem is actually fixed now," which clears
// the deprecation flag and re-passes the failing assertion in DataHub, so
// the trust score genuinely recovers instead of the page just claiming it
// did.
export function MarkFixedButton({ incidentId }: { incidentId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await markIncidentFixedAction(incidentId);
            const bits: string[] = [];
            if (result.unflagged) bits.push("unflagged");
            if (result.assertions_repassed.length) bits.push(`${result.assertions_repassed.length} check(s) re-passed`);
            toast.success(bits.length ? `Marked fixed — ${bits.join(", ")}.` : "Marked fixed — nothing to clear.");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to mark fixed.");
          }
        })
      }
    >
      <Wrench className="size-4" />
      {pending ? "Fixing…" : "Mark fixed"}
    </Button>
  );
}
