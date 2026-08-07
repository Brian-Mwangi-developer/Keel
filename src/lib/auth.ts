import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { organization } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"



const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({adapter});
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins:[
        organization(),
        // Must stay last so it can capture cookies set by the plugins above.
        nextCookies(),
    ]
});