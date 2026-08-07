import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { ac, owner, admin, member } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins:[
        organization({
            ac,
            roles: { owner, admin, member },
            // "Teams" here are Keel's Departments — sub-groups within an
            // organization that users get added to individually. Per-team
            // admin/member is tracked separately in DepartmentRole, see
            // src/lib/permissions.ts for why.
            teams: {
                enabled: true,
                maximumMembersPerTeam: 500,
            },
        }),
        // Must stay last so it can capture cookies set by the plugins above.
        nextCookies(),
    ]
});