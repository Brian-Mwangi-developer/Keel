"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { APIError } from "better-auth/api"

export type SignupFormState = {
  error?: string
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>
}

/**
 * Every signup after the first joins the one existing organization
 * (see join.ts) as a plain member. There's no organization picker or
 * org ID to enter — this build only ever runs one organization.
 */
export async function signupAction(
  _prevState: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const organization = await prisma.organization.findFirst()
  if (!organization) {
    redirect("/join")
  }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  const fieldErrors: SignupFormState["fieldErrors"] = {}
  if (!name) fieldErrors.name = "Enter your name."
  if (!email) fieldErrors.email = "Enter your email address."
  if (!password || password.length < 8)
    fieldErrors.password = "Password must be at least 8 characters."

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  try {
    const { headers: signUpHeaders, response } = await auth.api.signUpEmail({
      body: { name, email, password },
      returnHeaders: true,
    })

    const sessionCookie = signUpHeaders.get("set-cookie")
    if (!sessionCookie) {
      return { error: "Could not create your account. Please try again." }
    }

    const asUser = new Headers({ cookie: sessionCookie })

    await auth.api.addMember({
      body: {
        userId: response.user.id,
        organizationId: organization.id,
        role: "member",
      },
      headers: asUser,
    })

    await auth.api.setActiveOrganization({
      body: { organizationId: organization.id },
      headers: asUser,
    })
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "USER_ALREADY_EXISTS") {
        return { fieldErrors: { email: "An account with this email already exists." } }
      }
      return { error: error.body?.message ?? "Something went wrong. Please try again." }
    }
    return { error: "Something went wrong. Please try again." }
  }

  redirect("/dashboard?welcome=member")
}
