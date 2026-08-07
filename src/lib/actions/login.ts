"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { APIError } from "better-auth/api"

export type LoginFormState = {
  error?: string
  fieldErrors?: Partial<Record<"email" | "password", string>>
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  const fieldErrors: LoginFormState["fieldErrors"] = {}
  if (!email) fieldErrors.email = "Enter your email address."
  if (!password) fieldErrors.password = "Enter your password."

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  try {
    // auth.api calls run through the nextCookies plugin, which writes the
    // session cookie onto the response for us.
    await auth.api.signInEmail({
      body: { email, password },
    })
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
        return { error: "Incorrect email or password." }
      }
      return { error: error.body?.message ?? "Something went wrong. Please try again." }
    }
    return { error: "Something went wrong. Please try again." }
  }

  redirect("/dashboard")
}
