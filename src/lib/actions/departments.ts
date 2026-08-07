"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { APIError } from "better-auth/api"

export type DepartmentFormState = {
  error?: string
  fieldErrors?: Partial<Record<"name", string>>
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new Error("Not authenticated")
  }
  return session
}

/**
 * Departments are better-auth "teams" under the hood (see src/lib/auth.ts).
 * Better Auth's createTeam does not add the creator as a member, and its
 * teamMember table has no room for a role, so we do both steps ourselves:
 * add the creator as a team member, then record them as "admin" in our
 * companion DepartmentRole table.
 */
export async function createDepartmentAction(
  _prevState: DepartmentFormState,
  formData: FormData
): Promise<DepartmentFormState> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { fieldErrors: { name: "Enter a department name." } }
  }

  const session = await requireSession()
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return { error: "Select an organization before creating a department." }
  }

  const requestHeaders = await headers()

  try {
    const team = await auth.api.createTeam({
      body: { name, organizationId },
      headers: requestHeaders,
    })

    const teamMember = await auth.api.addTeamMember({
      body: { teamId: team.id, userId: session.user.id },
      headers: requestHeaders,
    })

    await prisma.departmentRole.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        teamMemberId: teamMember.id,
        role: "admin",
      },
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.body?.message ?? "Something went wrong. Please try again." }
    }
    return { error: "Something went wrong. Please try again." }
  }

  revalidatePath("/departments")
  return {}
}

export async function addDepartmentMemberAction(teamId: string, userId: string) {
  const session = await requireSession()
  await requireDepartmentAdmin(teamId, session.user.id)
  const requestHeaders = await headers()

  const teamMember = await auth.api.addTeamMember({
    body: { teamId, userId },
    headers: requestHeaders,
  })

  await prisma.departmentRole.create({
    data: {
      teamId,
      userId,
      teamMemberId: teamMember.id,
      role: "member",
    },
  })

  revalidatePath("/departments")
  return { success: true } as const
}

export async function removeDepartmentMemberAction(teamId: string, userId: string) {
  const session = await requireSession()
  await requireDepartmentAdmin(teamId, session.user.id)
  const requestHeaders = await headers()

  await auth.api.removeTeamMember({
    body: { teamId, userId },
    headers: requestHeaders,
  })

  // The DepartmentRole row cascades via teamMemberId's onDelete: Cascade
  // once better-auth's removeTeamMember deletes the underlying teamMember
  // row, so no separate cleanup is needed here.

  revalidatePath("/departments")
  return { success: true } as const
}

export async function setDepartmentMemberRoleAction(
  teamId: string,
  userId: string,
  role: "admin" | "member"
) {
  const session = await requireSession()
  await requireDepartmentAdmin(teamId, session.user.id)

  await prisma.departmentRole.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role },
  })

  revalidatePath("/departments")
  return { success: true } as const
}

async function requireDepartmentAdmin(teamId: string, userId: string) {
  const role = await prisma.departmentRole.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (role?.role !== "admin") {
    throw new Error("Only department admins can do this.")
  }
}
