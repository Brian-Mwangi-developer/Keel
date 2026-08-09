"use client";
import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            isActive={pathname === item.url || pathname?.startsWith(`${item.url}/`)}
            render={
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            }
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
