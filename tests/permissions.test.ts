import { describe, it, expect } from "vitest";
import { getBoardPermissions } from "../src/utils/permissions";

describe("getBoardPermissions", () => {
  it("gives owner full access", () => {
    const perms = getBoardPermissions("owner");
    expect(perms.canManageBoard).toBe(true);
    expect(perms.canManageMembers).toBe(true);
    expect(perms.canManageColumns).toBe(true);
    expect(perms.canCreateTask).toBe(true);
    expect(perms.canEditTask).toBe(true);
    expect(perms.canDeleteTask).toBe(true);
  });

  it("restricts member to view + edit tasks only", () => {
    const perms = getBoardPermissions("member");
    expect(perms.canManageBoard).toBe(false);
    expect(perms.canManageMembers).toBe(false);
    expect(perms.canManageColumns).toBe(false);
    expect(perms.canCreateTask).toBe(false);
    expect(perms.canEditTask).toBe(true);
    expect(perms.canDeleteTask).toBe(false);
  });

  it("gives no permissions for null role (not a board member)", () => {
    const perms = getBoardPermissions(null);
    expect(perms.canManageBoard).toBe(false);
    expect(perms.canManageMembers).toBe(false);
    expect(perms.canManageColumns).toBe(false);
    expect(perms.canCreateTask).toBe(false);
    expect(perms.canEditTask).toBe(false);
    expect(perms.canDeleteTask).toBe(false);
  });
});
