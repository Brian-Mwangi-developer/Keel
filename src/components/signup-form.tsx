"use client"

import { useActionState, useState } from "react"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

import { signupAction, type SignupFormState } from "@/lib/actions/signup"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

const initialState: SignupFormState = {}

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Logo className="text-2xl" />
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Join your team&apos;s organization on Keel.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input
            id="name"
            name="name"
            placeholder="Jane Doe"
            autoComplete="name"
            aria-invalid={!!state.fieldErrors?.name}
            disabled={isPending}
          />
          <FieldError errors={[{ message: state.fieldErrors?.name }]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@acme.com"
            autoComplete="email"
            aria-invalid={!!state.fieldErrors?.email}
            disabled={isPending}
          />
          <FieldError errors={[{ message: state.fieldErrors?.email }]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="min 8 characters"
              autoComplete="new-password"
              aria-invalid={!!state.fieldErrors?.password}
              disabled={isPending}
              className="pr-8"
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              disabled={isPending}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          <FieldError errors={[{ message: state.fieldErrors?.password }]} />
        </Field>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Create account
        </Button>

        <FieldDescription className="text-center">
          Already have an account? <a href="/login">Sign in</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
