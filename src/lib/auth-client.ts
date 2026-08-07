import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, owner, admin, member } from "@/lib/permissions"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    plugins: [
        organizationClient({
            ac,
            roles: { owner, admin, member },
            teams: {
                enabled: true,
            },
        }),
    ],
})
