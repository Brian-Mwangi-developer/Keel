"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, FlagOff, UserPlus, Sparkles } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OwnerPicker } from "@/components/keel/owner-picker";
import {
  assignOwnerAction,
  flagUnsafeAction,
  investigateAction,
  unflagAction,
} from "@/lib/keel/actions";
import type { OwnerOut } from "@/lib/keel/types";

export function AssetActions({ urn, fullyRegistered }: { urn: string; fullyRegistered: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <FlagUnsafeDialog urn={urn} />
      <AssignOwnerDialog urn={urn} />
      {fullyRegistered && <InvestigateButton urn={urn} />}
    </div>
  );
}

function FlagUnsafeDialog({ urn }: { urn: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Flag className="size-3.5" />
        Flag unsafe
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag as unsafe to consume</DialogTitle>
          <DialogDescription>
            Writes deprecation status to DataHub — visible to anyone browsing the catalog, not only here.
          </DialogDescription>
        </DialogHeader>
        <Textarea placeholder="Why is this unsafe? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await flagUnsafeAction(urn, note || undefined);
                  toast.success("Flagged unsafe to consume.");
                  setOpen(false);
                  setNote("");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to flag asset.");
                }
              })
            }
          >
            {pending ? "Flagging…" : "Flag unsafe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UnflagButton({ urn }: { urn: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await unflagAction(urn);
            toast.success("Unflagged.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to unflag asset.");
          }
        })
      }
    >
      <FlagOff className="size-3.5" />
      {pending ? "Clearing…" : "Unflag"}
    </Button>
  );
}

function AssignOwnerDialog({ urn }: { urn: string }) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState<OwnerOut | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setOwner(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="size-3.5" />
        Assign owner
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign an owner</DialogTitle>
          <DialogDescription>
            Ownership is 25% of an asset&apos;s own health — assigning one to an unowned asset moves its score
            immediately. Search is live against DataHub&apos;s own user and group directory.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Owner</Label>
          <OwnerPicker value={owner} onChange={setOwner} />
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !owner}
            onClick={() =>
              startTransition(async () => {
                if (!owner) return;
                try {
                  await assignOwnerAction(urn, owner.urn, owner.type === "group" ? "data_owner" : "technical_owner");
                  toast.success(`${owner.display_name} assigned — score recomputed.`);
                  setOpen(false);
                  setOwner(null);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to assign owner.");
                }
              })
            }
          >
            {pending ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvestigateButton({ urn }: { urn: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await investigateAction(urn);
            toast.success("Investigation complete — awaiting your review.");
            router.push(`/incidents/${encodeURIComponent(result.incident_id)}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Investigation failed.");
          }
        })
      }
    >
      <Sparkles className="size-3.5" />
      {pending ? "Investigating…" : "Investigate with agent"}
    </Button>
  );
}
