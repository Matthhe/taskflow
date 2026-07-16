export type BoardRole = "owner" | "member";

export interface BoardPermissions {
  canManageBoard: boolean;
  canManageMembers: boolean;
  canManageColumns: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
}

export const getBoardPermissions = (
  role: BoardRole | null,
): BoardPermissions => {
  const isOwner = role === "owner";

  return {
    canManageBoard: isOwner,
    canManageMembers: isOwner,
    canManageColumns: isOwner,
    canCreateTask: isOwner,
    canEditTask: isOwner || role === "member",
    canDeleteTask: isOwner,
  };
};
