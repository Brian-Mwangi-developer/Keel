"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Bell,
  Bot,
  Database,
  LibraryBig,
  ListChecks,
  MessageCircleQuestion,
  Settings2,
  ShieldAlert,
  Waypoints,
  Users,
  Users2,
} from "lucide-react";
import type { Organization, Team } from "@/generated/prisma/client";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

function getNavMain(isOrgOwner: boolean) {
  return [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LibraryBig,
    },
    {
      title: "Assets",
      url: "/assets",
      icon: Waypoints,
    },
    {
      title: "Quality rules",
      url: "/rules",
      icon: ListChecks,
    },
    {
      title: "Sources",
      url: "/sources",
      icon: Database,
    },
    {
      title: "Incidents",
      url: "/incidents",
      icon: Bot,
    },
    {
      title: "Departments",
      url: "/departments",
      icon: Users2,
    },
    // Only the organization owner can see the full user roster.
    ...(isOrgOwner
      ? [
          {
            title: "Users",
            url: "/users",
            icon: Users,
          },
        ]
      : []),
  ];
}

const navSecondary = [
  {
    title: "Severity policy",
    url: "/settings/severity-policy",
    icon: ShieldAlert,
  },
  {
    title: "Notification routing",
    url: "/settings/notification-routing",
    icon: Bell,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings2,
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
  isOrgOwner,
  ...props
}: {
  organization: Organization | null;
  teams: Team[];
  activeTeamId: string | null;
  isOrgOwner: boolean;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organization={organization}
          teams={teams}
          activeTeamId={activeTeamId}
          isOrgOwner={isOrgOwner}
        />
        <NavMain items={getNavMain(isOrgOwner)} />
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
