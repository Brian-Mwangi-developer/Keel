import { MoreHorizontalIcon, ShieldIcon } from "lucide-react";

import type { Team, TeamMember, DepartmentRole, User } from "@/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { DepartmentMemberMenu } from "@/components/departments/department-member-menu";

type MemberWithUser = TeamMember & {
  user: User;
  departmentRole: DepartmentRole | null;
};

export function DepartmentCard({
  team,
  currentUserId,
}: {
  team: Team & { members: MemberWithUser[] };
  currentUserId: string;
}) {
  const currentMember = team.members.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.departmentRole?.role === "admin";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate">{team.name}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground">
            {team.members.length} member{team.members.length === 1 ? "" : "s"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {team.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 hover:bg-muted/50"
          >
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar user={member.user} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {member.departmentRole?.role === "admin" && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldIcon className="size-3" />
                  Admin
                </span>
              )}
              {isAdmin ? (
                <DepartmentMemberMenu
                  teamId={team.id}
                  userId={member.userId}
                  role={member.departmentRole?.role === "admin" ? "admin" : "member"}
                  disabled={member.userId === currentUserId}
                />
              ) : (
                <MoreHorizontalIcon className="size-4 text-transparent" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
