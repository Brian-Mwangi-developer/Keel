"use server"

import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { APIError } from "better-auth/api"

export type JoinFormState = {
  error?: string
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "organizationName", string>>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export async function joinAction(
  _prevState: JoinFormState,
  formData: FormData
): Promise<JoinFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const organizationName = String(formData.get("organizationName") ?? "").trim()
  const logo = formData.get("logo")

  const fieldErrors: JoinFormState["fieldErrors"] = {}
  if (!name) fieldErrors.name = "Enter your name."
  if (!email) fieldErrors.email = "Enter your email address."
  if (!password || password.length < 8)
    fieldErrors.password = "Password must be at least 8 characters."
  if (!organizationName) fieldErrors.organizationName = "Enter your organization name."

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  try {
    let logoUrl: string | undefined
    if (logo instanceof File && logo.size > 0) {
      const extension = logo.name.split(".").pop() || "png"
      const blob = await put(
        `organizations/logos/${slugify(organizationName)}.${extension}`,
        logo,
        {
          access: "public",
          addRandomSuffix: true,
          contentType: logo.type || undefined,
        }
      )
      logoUrl = blob.url
    }

    // Create the user. `returnHeaders` gives us the raw `set-cookie` for the
    // new session so we can immediately act as that user below, without
    // depending on Next's request/response cookie jars being in sync yet.
    const { headers: signUpHeaders } = await auth.api.signUpEmail({
      body: { name, email, password },
      returnHeaders: true,
    })

    const sessionCookie = signUpHeaders.get("set-cookie")
    if (!sessionCookie) {
      return { error: "Could not create your account. Please try again." }
    }

    const asUser = new Headers({ cookie: sessionCookie })

    const baseSlug = slugify(organizationName) || "org"
    let slug = baseSlug
    let attempt = 0
    while (attempt < 5) {
      try {
        await auth.api.createOrganization({
          body: { name: organizationName, slug, logo: logoUrl },
          headers: asUser,
        })
        break
      } catch (error) {
        if (error instanceof APIError && error.body?.code === "ORGANIZATION_ALREADY_EXISTS") {
          attempt += 1
          slug = `${baseSlug}-${attempt + 1}`
          continue
        }
        throw error
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "USER_ALREADY_EXISTS") {
        return { fieldErrors: { email: "An account with this email already exists." } }
      }
      return { error: error.body?.message ?? "Something went wrong. Please try again." }
    }
    return { error: "Something went wrong. Please try again." }
  }

  redirect("/dashboard")
}
