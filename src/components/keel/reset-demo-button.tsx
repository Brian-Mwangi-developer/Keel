"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resetDemoAction } from "@/lib/keel/actions";

/**
 * Live testing and a live demo share the same DataHub instance -- flags,
 * injected failures, and open incidents from a prior session are still
 * there next time. This restores a clean baseline on demand.
 */
export function ResetDemoButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await resetDemoAction();
            toast.success(
              `Reset: ${result.unflagged.length} unflagged, ${result.assertions_repassed.length} check(s) restored, ${result.incidents_denied.length} incident(s) cleared.`,
            );
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Reset failed.");
          }
        })
      }
    >
      <RotateCcw className="size-3.5" />
      {pending ? "Resetting…" : "Reset demo"}
    </Button>
  );
}
