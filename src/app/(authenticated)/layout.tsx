import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { NotificationBell } from "@/components/keel/notification-bell";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AuthenticatedLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const organizationId = session.session.activeOrganizationId;
  const [organization, teams, currentMember] = organizationId
    ? await Promise.all([
        prisma.organization.findUnique({ where: { id: organizationId } }),
        prisma.team.findMany({
          where: { organizationId },
          orderBy: { createdAt: "asc" },
        }),
        prisma.member.findFirst({
          where: { organizationId, userId: session.user.id },
        }),
      ])
    : [null, [], null];

  return (
    <SidebarProvider>
      <AppSidebar
        organization={organization}
        teams={teams}
        activeTeamId={session.session.activeTeamId ?? null}
        isOrgOwner={currentMember?.role === "owner"}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger />
          <NotificationBell />
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
