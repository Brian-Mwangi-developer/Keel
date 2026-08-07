import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateDepartmentDialog } from "@/components/departments/create-department-dialog";
import { DepartmentCard } from "@/components/departments/department-card";
import { Users2Icon } from "lucide-react";

export const metadata: Metadata = {
  title: "Departments — Keel",
  description: "Manage the departments in your organization and who's in them.",
};

export default async function DepartmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have an active organization yet.
        </p>
      </div>
    );
  }

  const teams = await prisma.team.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      members: {
        include: { user: true, departmentRole: true },
      },
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Group members of your organization into departments and manage who
            can administer each one.
          </p>
        </div>
        <CreateDepartmentDialog />
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Users2Icon className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No departments yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first department to start grouping members.
            </p>
          </div>
          <CreateDepartmentDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <DepartmentCard
              key={team.id}
              team={team}
              currentUserId={session.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
