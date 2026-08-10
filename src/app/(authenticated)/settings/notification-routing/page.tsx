import { listDepartmentChannels } from "@/lib/keel/client";
import { NotificationRoutingManager } from "@/components/keel/notification-routing-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NotificationRoutingPage() {
  const channels = await listDepartmentChannels();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Notification routing</h1>
        <p className="text-sm text-muted-foreground">
          Map a department to a real Slack channel. DataHub has no Slack field to derive this from — create the channel,
          invite the bot, paste its ID here. &quot;Notify departments&quot; on an asset resolves its owning department
          from this list (matched by domain) plus anyone declared as an interested consumer of it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>Each gets an AI-drafted message tailored to whether they own the asset or just depend on it.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationRoutingManager initialChannels={channels} />
        </CardContent>
      </Card>
    </div>
  );
}
