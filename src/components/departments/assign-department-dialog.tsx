"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { assignUserToDepartmentAction } from "@/lib/actions/departments"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AssignableDepartment = {
  id: string
  name: string
}

const ROLE_ITEMS = [
  { value: "member" as const, label: "Member" },
  { value: "admin" as const, label: "Admin" },
]

export function AssignDepartmentDialog({
  userId,
  userName,
  departments,
}: {
  userId: string
  userName: string
  departments: AssignableDepartment[]
}) {
  const [open, setOpen] = useState(false)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [role, setRole] = useState<"admin" | "member">("member")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!teamId) {
      setError("Choose a department.")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await assignUserToDepartmentAction(teamId, userId, role)
        toast.success(`Added ${userName} to a department`)
        setOpen(false)
        setTeamId(null)
        setRole("member")
      } catch {
        toast.error("Couldn't assign that department.")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setTeamId(null)
          setRole("member")
          setError(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="xs">
            <UserPlusIcon />
            Assign
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {userName} to a department</DialogTitle>
          <DialogDescription>
            Choose a department and the role they should have in it.
          </DialogDescription>
        </DialogHeader>

        {departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No departments to assign yet — create one from the Departments
            page first, or {userName} is already in all of them.
          </p>
        ) : (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="assign-department">Department</FieldLabel>
              <Select
                items={departments.map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
                value={teamId}
                onValueChange={(value) => setTeamId(value)}
              >
                <SelectTrigger id="assign-department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[{ message: error ?? undefined }]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="assign-role">Role</FieldLabel>
              <Select
                items={ROLE_ITEMS}
                value={role}
                onValueChange={(value) => value && setRole(value)}
              >
                <SelectTrigger id="assign-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        )}

        {departments.length > 0 && (
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
