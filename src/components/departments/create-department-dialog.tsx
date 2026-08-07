"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, PlusIcon } from "lucide-react"

import {
  createDepartmentAction,
  type DepartmentFormState,
} from "@/lib/actions/departments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const initialState: DepartmentFormState = {}

/**
 * Uncontrolled by default (renders its own trigger button). Pass `open` +
 * `onOpenChange` to drive it from elsewhere instead — e.g. from a menu
 * item's onClick, per Base UI's documented "connecting a dialog to a
 * menu" pattern (the dialog must live outside the menu, not nested
 * inside a Menu.Item, or the menu unmounting on click tears it down).
 * In controlled mode no trigger is rendered.
 */
export function CreateDepartmentDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isControlled = openProp !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = isControlled ? openProp : uncontrolledOpen
  const setOpen = isControlled ? onOpenChangeProp! : setUncontrolledOpen

  const [state, setState] = useState<DepartmentFormState>(initialState)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createDepartmentAction(state, formData)
      setState(result)
      if (!result.error && !result.fieldErrors) {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setState(initialState)
      }}
    >
      {!isControlled && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button variant="outline" size="sm">
                <PlusIcon />
                New department
              </Button>
            )
          }
        />
      )}
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create department</DialogTitle>
            <DialogDescription>
              Departments group members within your organization. You&apos;ll be
              added as the department admin.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="department-name">Name</FieldLabel>
              <Input
                id="department-name"
                name="name"
                placeholder="Engineering"
                autoFocus
                aria-invalid={!!state.fieldErrors?.name}
                disabled={isPending}
              />
              <FieldError errors={[{ message: state.fieldErrors?.name }]} />
            </Field>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Create department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
