"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

const WELCOME_MESSAGES = {
  org: "Organization created — welcome to Keel!",
  member: "Account created — welcome to Keel!",
} as const

/**
 * Fires a one-time toast after landing on /dashboard?welcome=org|member
 * (see join.ts / signup.ts). The redirect that gets a fresh user here
 * happens server-side, so there's no client component left alive at the
 * point of creation to fire a toast from — this reads the signal back
 * off the URL on arrival instead, then strips it so a refresh or share
 * of the link doesn't re-fire it.
 */
export function WelcomeToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const welcome = searchParams.get("welcome")

  useEffect(() => {
    if (welcome !== "org" && welcome !== "member") return

    toast.success(WELCOME_MESSAGES[welcome])

    const params = new URLSearchParams(searchParams)
    params.delete("welcome")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
    // Only re-run if the welcome param itself changes; router/pathname/
    // searchParams are stable enough here and including them would just
    // add noise without changing behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcome])

  return null
}
