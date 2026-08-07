import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

// Organization-level access control. We keep Better Auth's default
// statements/roles (owner, admin, member) as-is — department (team)
// admin/member is a *separate* concept tracked in the DepartmentRole
// table (see prisma/schema.prisma), not through this org-level ac,
// since better-auth's teamMember table can't carry a custom role field.
//
// Rebuilt from `defaultStatements` (rather than reusing better-auth's
// own `defaultAc`/`defaultRoles` singletons) so the resulting `ac`/role
// types line up with what `organization()`/`organizationClient()` expect.
export const statement = defaultStatements;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
  organization: ["update"],
  invitation: ["create", "cancel"],
  member: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
});

export const member = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
});
