import { useMemo } from "react";
import { getBoardPermissions } from "../utils/permissions";

export const useBoardPermissions = (
  boardOwnerId: string | null,
  userId: string | undefined,
) => {
  return useMemo(() => {
    const role = boardOwnerId
      ? userId === boardOwnerId
        ? "owner"
        : "member"
      : null;
    return getBoardPermissions(role);
  }, [boardOwnerId, userId]);
};
