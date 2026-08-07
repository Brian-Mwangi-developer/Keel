"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Blocks,
  Calendar,
  LibraryBig,
  MessageCircleQuestion,
  Settings2,
  Trash2,
  Users2,
} from "lucide-react";
import type { Organization, Team } from "@/generated/prisma/client";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LibraryBig,
    isActive: true,
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Users2,
  },
];

const navSecondary = [
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings2,
  },
  {
    title: "Templates",
    url: "#",
    icon: Blocks,
  },
  {
    title: "Trash",
    url: "#",
    icon: Trash2,
  },
  {
    title: "Help",
    url: "#",
    icon: MessageCircleQuestion,
  },
];

export function AppSidebar({
  organization,
  teams,
  activeTeamId,
  ...props
}: {
  organization: Organization | null;
  teams: Team[];
  activeTeamId: string | null;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organization={organization}
          teams={teams}
          activeTeamId={activeTeamId}
        />
        <NavMain items={navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
