import { Logo } from "@/components/logo";

export default function DashboardPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-center">
      <Logo className="text-3xl" />
      <p className="text-sm text-muted-foreground">Dashboard — coming soon.</p>
    </div>
  );
}
