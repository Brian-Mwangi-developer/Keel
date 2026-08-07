import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { WelcomeToast } from "@/components/welcome-toast";

export default function DashboardPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-center">
      <Suspense fallback={null}>
        <WelcomeToast />
      </Suspense>
      <Logo className="text-3xl" />
      <p className="text-sm text-muted-foreground">Dashboard — coming soon.</p>
    </div>
  );
}
