"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDepartmentChannelAction, removeDepartmentChannelAction } from "@/lib/keel/actions";
import type { DepartmentChannelOut } from "@/lib/keel/types";

/**
 * Department -> Slack channel routing, same shape as SeverityPolicyManager:
 * DataHub has no Slack field on CorpGroup, so an org owner pastes in each
 * channel's ID once, after creating the channel and inviting the bot (see
 * keel-backend's app/integrations/slack.py). The domain is optional but is
 * what lets Notify departments resolve "this asset's owner" automatically
 * from EntitySummary.domain -- without it, the department can still be
 * targeted as an interested consumer manually.
 */
export function NotificationRoutingManager({ initialChannels }: { initialChannels: DepartmentChannelOut[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [department, setDepartment] = useState("");
  const [domainUrn, setDomainUrn] = useState("");
  const [channelId, setChannelId] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {channels.length === 0 && <p className="text-sm text-muted-foreground">No departments configured yet.</p>}
        {channels.map((channel) => (
          <div key={channel.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{channel.department}</span>
              {channel.domain_urn && <span className="font-mono text-xs text-muted-foreground">{channel.domain_urn}</span>}
              <span className="text-muted-foreground">→</span>
              <span className="font-mono text-xs">#{channel.slack_channel_id}</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await removeDepartmentChannelAction(channel.id);
                    setChannels((prev) => prev.filter((c) => c.id !== channel.id));
                    toast.success("Removed.");
                    router.refresh();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to remove channel.");
                  }
                })
              }
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Department</Label>
          <Input placeholder="Engineering" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Domain URN (optional)</Label>
          <Input
            placeholder="urn:li:domain:engineering"
            value={domainUrn}
            onChange={(e) => setDomainUrn(e.target.value)}
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Slack channel ID</Label>
          <Input placeholder="C0XXXXXXX" value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-40" />
        </div>
        <Button
          disabled={pending || !department.trim() || !channelId.trim()}
          onClick={() =>
            startTransition(async () => {
              try {
                const created = await addDepartmentChannelAction({
                  department: department.trim(),
                  domain_urn: domainUrn.trim() || null,
                  slack_channel_id: channelId.trim(),
                });
                setChannels((prev) => [...prev, created]);
                setDepartment("");
                setDomainUrn("");
                setChannelId("");
                toast.success("Channel added.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to add channel.");
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
