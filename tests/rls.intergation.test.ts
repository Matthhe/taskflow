/// <reference types="vite/client" />
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ownerEmail = import.meta.env.VITE_TEST_OWNER_EMAIL;
const ownerPassword = import.meta.env.VITE_TEST_OWNER_PASSWORD;
const memberEmail = import.meta.env.VITE_TEST_MEMBER_EMAIL;
const memberPassword = import.meta.env.VITE_TEST_MEMBER_PASSWORD;

const canRun = Boolean(
  url &&
  anonKey &&
  ownerEmail &&
  ownerPassword &&
  memberEmail &&
  memberPassword,
);

const describeOrSkip = canRun ? describe : describe.skip;

describeOrSkip("RLS policies (live Supabase project)", () => {
  const ownerClient = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const memberClient = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let boardId: string;
  let ownerId: string;
  let memberId: string;

  beforeAll(async () => {
    const { data: ownerAuth, error: ownerErr } =
      await ownerClient.auth.signInWithPassword({
        email: ownerEmail,
        password: ownerPassword,
      });
    if (ownerErr) throw ownerErr;
    ownerId = ownerAuth.user!.id;

    const { data: memberAuth, error: memberErr } =
      await memberClient.auth.signInWithPassword({
        email: memberEmail,
        password: memberPassword,
      });
    if (memberErr) throw memberErr;
    memberId = memberAuth.user!.id;

    const { data: board, error: boardErr } = await ownerClient.rpc(
      "create_board_with_defaults",
      { _title: "RLS test board" },
    );
    if (boardErr) throw boardErr;
    boardId = board!.id;
  });

  it("owner can read their own board", async () => {
    const { data, error } = await ownerClient
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBe(boardId);
  });

  it("a user who is not a member cannot read the board", async () => {
    const { data } = await memberClient
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("a non-member cannot create a column on someone else's board", async () => {
    const { error } = await memberClient
      .from("columns")
      .insert([{ board_id: boardId, title: "Hacked column", position: 99 }]);
    expect(error).not.toBeNull();
  });

  it("owner can add the member to the board", async () => {
    const { error } = await ownerClient
      .from("board_members")
      .insert([{ board_id: boardId, user_id: memberId, role: "member" }]);
    expect(error).toBeNull();
  });

  it("member can now read the board and its columns", async () => {
    const { data: board, error: boardErr } = await memberClient
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();
    expect(boardErr).toBeNull();
    expect(board?.id).toBe(boardId);

    const { data: cols, error: colsErr } = await memberClient
      .from("columns")
      .select("*")
      .eq("board_id", boardId);
    expect(colsErr).toBeNull();
    expect(cols?.length).toBeGreaterThan(0);
  });

  it("member cannot create a new column (owner-only)", async () => {
    const { error } = await memberClient
      .from("columns")
      .insert([{ board_id: boardId, title: "Member column", position: 5 }]);
    expect(error).not.toBeNull();
  });

  it("member can create a task in an existing column", async () => {
    const { data: cols } = await ownerClient
      .from("columns")
      .select("*")
      .eq("board_id", boardId)
      .limit(1);
    const columnId = cols![0].id;

    const { error } = await memberClient.from("tasks").insert([
      {
        title: "Member-created task",
        column_id: columnId,
        created_by: memberId,
        position: 0,
      },
    ]);
    expect(error).not.toBeNull();
  });

  it("member can update an existing task (view + edit permission)", async () => {
    const { data: cols } = await ownerClient
      .from("columns")
      .select("*")
      .eq("board_id", boardId)
      .limit(1);
    const columnId = cols![0].id;

    const { data: task } = await ownerClient
      .from("tasks")
      .insert([
        {
          title: "Owner-created task",
          column_id: columnId,
          created_by: ownerId,
          position: 0,
        },
      ])
      .select()
      .single();

    const { error } = await memberClient
      .from("tasks")
      .update({ title: "Edited by member" })
      .eq("id", task!.id);
    expect(error).toBeNull();
  });

  it("member cannot delete the board", async () => {
    const { error } = await memberClient
      .from("boards")
      .delete()
      .eq("id", boardId);
    expect(error).toBeNull();

    const { data } = await ownerClient
      .from("boards")
      .select("id")
      .eq("id", boardId)
      .maybeSingle();
    expect(data).not.toBeNull();
  });

  it("owner can delete the board", async () => {
    const { error } = await ownerClient
      .from("boards")
      .delete()
      .eq("id", boardId);
    expect(error).toBeNull();
  });
});
