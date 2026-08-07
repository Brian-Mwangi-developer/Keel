"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Users2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { Organization, Team } from "@/generated/prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CreateDepartmentDialog } from "@/components/departments/create-department-dialog";

export function TeamSwitcher({
  organization,
  teams,
  activeTeamId,
}: {
  organization: Organization | null;
  teams: Team[];
  activeTeamId: string | null;
}) {
  const router = useRouter();
  const [pendingTeamId, setPendingTeamId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? null;

  if (!organization) {
    return null;
  }

  async function switchTeam(teamId: string | null) {
    setPendingTeamId(teamId);
    try {
      await authClient.organization.setActiveTeam({ teamId });
      router.refresh();
    } catch {
      toast.error("Couldn't switch departments.");
    } finally {
      setPendingTeamId(null);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="w-fit px-1.5">
                <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <Users2 className="size-3" />
                </div>
                <span className="truncate font-medium">
                  {activeTeam?.name ?? organization.name}
                </span>
                <ChevronDown className="opacity-50" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {organization.name}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => switchTeam(null)}
                disabled={pendingTeamId !== null}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <Users2 className="size-4 shrink-0" />
                </div>
                Whole organization
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {teams.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Departments
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {teams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => switchTeam(team.id)}
                      disabled={pendingTeamId !== null}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-xs border">
                        <Users2 className="size-4 shrink-0" />
                      </div>
                      {team.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setCreateOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add department
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Lives outside the menu so it survives the menu unmounting on
          click — see Base UI's "connecting a dialog to a menu" pattern. */}
      <CreateDepartmentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarMenu>
  );
}
