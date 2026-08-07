"use client"

import { useActionState, useRef, useState } from "react"
import { EyeIcon, EyeOffIcon, ImageUpIcon, Loader2Icon } from "lucide-react"

import { joinAction, type JoinFormState } from "@/lib/actions/join"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const initialState: JoinFormState = {}

export function JoinForm() {
  const [state, formAction, isPending] = useActionState(joinAction, initialState)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setLogoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Logo className="text-2xl" />
        <h1 className="text-xl font-semibold tracking-tight">Create your organization</h1>
        <p className="text-sm text-muted-foreground">
          Set up your workspace and admin account to get started.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="organizationName">Organization name</FieldLabel>
          <Input
            id="organizationName"
            name="organizationName"
            placeholder="Acme Inc."
            autoComplete="organization"
            aria-invalid={!!state.fieldErrors?.organizationName}
            disabled={isPending}
          />
          <FieldError errors={[{ message: state.fieldErrors?.organizationName }]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="logo">Organization logo</FieldLabel>
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="rounded-lg">
              <AvatarImage src={logoPreview ?? undefined} className="rounded-lg" />
              <AvatarFallback className="rounded-lg">
                <ImageUpIcon className="size-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload logo
            </Button>
            <input
              ref={fileInputRef}
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoChange}
              disabled={isPending}
            />
          </div>
          <FieldDescription>Optional. PNG or JPG, up to 4MB.</FieldDescription>
        </Field>

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
          Create organization
        </Button>

        <FieldDescription className="text-center">
          Already have an account? <a href="/login">Sign in</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
