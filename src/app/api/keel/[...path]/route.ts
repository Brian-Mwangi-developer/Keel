import { headers } from "next/headers";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

const BASE_URL = process.env.KEEL_BACKEND_URL ?? "http://localhost:8010";

/**
 * Thin, read-only proxy to keel-backend for CLIENT COMPONENTS that need
 * live data on demand (e.g. AssetDrawer opening on a lineage-graph node
 * click) -- src/lib/keel/client.ts is server-only and can't be called
 * from the browser. Mutations still go through Server Actions
 * (src/lib/keel/actions.ts), never through here, so the
 * verify-session-then-revalidate pattern stays intact for anything that
 * writes.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/keel/[...path]">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const upstream = await fetch(`${BASE_URL}/${path.join("/")}${request.nextUrl.search}`, {
    cache: "no-store",
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
