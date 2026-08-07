import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/user-avatar";
import { AssignDepartmentDialog } from "@/components/departments/assign-department-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Users — Keel",
  description: "Everyone in your organization and what they have access to.",
};

const ORG_ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default async function UsersPage() {
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

  // Only the organization owner can see this page — everyone else,
  // including org "admin" and department admins, is turned away. Members
  // with no department role of their own definitely shouldn't be able to
  // create departments (enforced in createDepartmentAction), and by the
  // same logic they have no business browsing the full roster either.
  const currentMember = await prisma.member.findFirst({
    where: { organizationId, userId: session.user.id },
  });
  if (currentMember?.role !== "owner") {
    redirect("/dashboard");
  }

  const [members, departments] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId },
      include: {
        user: {
          include: {
            departmentRoles: {
              where: { teamMember: { team: { organizationId } } },
              include: { teamMember: { include: { team: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Everyone in your organization and the departments they belong to.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Org role</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const memberDepartmentIds = new Set(
                member.user.departmentRoles.map((dr) => dr.teamMember.team.id)
              );
              const assignableDepartments = departments.filter(
                (department) => !memberDepartmentIds.has(department.id)
              );

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar user={member.user} size="sm" />
                      <span className="font-medium">{member.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell>
                    {ORG_ROLE_LABEL[member.role] ?? member.role}
                  </TableCell>
                  <TableCell>
                    {member.user.departmentRoles.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {member.user.departmentRoles.map((departmentRole) => (
                          <span
                            key={departmentRole.id}
                            className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {departmentRole.teamMember.team.name}
                            {departmentRole.role === "admin" && (
                              <span className="text-foreground">
                                &middot; admin
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AssignDepartmentDialog
                      userId={member.userId}
                      userName={member.user.name}
                      departments={assignableDepartments}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
