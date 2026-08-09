import { listSeverityRules } from "@/lib/keel/client";
import { SeverityPolicyManager } from "@/components/keel/severity-policy-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SeverityPolicyPage() {
  const rules = await listSeverityRules();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Severity policy</h1>
        <p className="text-sm text-muted-foreground">
          Declare that a sector/department (domain) or classification (tag) always carries at least a given severity —
          Keel&apos;s investigation agent can assess higher, but never lower than what you set here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>Matched against an incident&apos;s root-cause asset when the agent investigates.</CardDescription>
        </CardHeader>
        <CardContent>
          <SeverityPolicyManager initialRules={rules} />
        </CardContent>
      </Card>
    </div>
  );
}
