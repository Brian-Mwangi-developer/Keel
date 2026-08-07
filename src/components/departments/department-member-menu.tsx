"use client"

import { useState, useTransition } from "react"
import { MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import {
  removeDepartmentMemberAction,
  setDepartmentMemberRoleAction,
} from "@/lib/actions/departments"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DepartmentMemberMenu({
  teamId,
  userId,
  role,
  disabled,
}: {
  teamId: string
  userId: string
  role: "admin" | "member"
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleRoleChange(nextRole: "admin" | "member") {
    startTransition(async () => {
      try {
        await setDepartmentMemberRoleAction(teamId, userId, nextRole)
        toast.success(
          nextRole === "admin" ? "Made department admin" : "Removed as admin"
        )
      } catch {
        toast.error("Couldn't update that member's role.")
      }
    })
    setOpen(false)
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeDepartmentMemberAction(teamId, userId)
        toast.success("Removed from department")
      } catch {
        toast.error("Couldn't remove that member.")
      }
    })
    setOpen(false)
  }

  if (disabled) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" disabled={isPending}>
            <MoreHorizontalIcon />
            <span className="sr-only">Member actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {role === "admin" ? (
          <DropdownMenuItem onClick={() => handleRoleChange("member")}>
            Remove as admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
            Make admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={handleRemove}
        >
          Remove from department
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
