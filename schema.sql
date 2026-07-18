create table boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

create table columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date    date,
  assignee_id uuid references auth.users(id) on delete set null,
  position    integer not null default 0,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text,
  email      text
);

create table task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,
  file_size   integer,
  created_at  timestamptz default now()
);

create table activity_log (
  id              uuid primary key default gen_random_uuid(),
  board_id        uuid not null references boards(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  action          text not null,
  event_type      text,
  task_id         uuid references tasks(id) on delete cascade,
  from_column_id  uuid references columns(id) on delete set null,
  to_column_id    uuid references columns(id) on delete set null,
  created_at      timestamptz default now()
);

alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table profiles enable row level security;
alter table task_attachments enable row level security;
alter table activity_log enable row level security;

create or replace function public.is_board_member(_board_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from board_members
    where board_id = _board_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_board_owner(_board_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from boards
    where id = _board_id and owner_id = auth.uid()
  );
$$;

create or replace function public.check_user_access(board_id_param uuid)
returns boolean
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.boards where id = board_id_param and owner_id = auth.uid()
    union
    select 1 from public.board_members where board_id = board_id_param and user_id = auth.uid()
  );
end;
$$ language plpgsql;

create policy "boards_select" on boards for select
  to authenticated
  using (owner_id = auth.uid() or is_board_member(id));

create policy "boards_insert" on boards for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "boards_update" on boards for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "boards_delete" on boards for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "members_select" on board_members for select
  to authenticated
  using (check_user_access(board_id));

create policy "members_insert" on board_members for insert
  to authenticated
  with check (user_id = auth.uid() or is_board_owner(board_id));

create policy "members_delete" on board_members for delete
  to authenticated
  using (user_id = auth.uid() or is_board_owner(board_id));

create policy "columns_select" on columns for select
  to authenticated
  using (is_board_member(board_id));

create policy "columns_owner_write" on columns for all
  to authenticated
  using (is_board_owner(board_id))
  with check (is_board_owner(board_id));

create policy "tasks_select" on tasks for select
  to authenticated
  using (
    column_id in (select id from columns where is_board_member(board_id))
  );

create policy "tasks_update" on tasks for update
  to authenticated
  using (
    column_id in (select id from columns where is_board_member(board_id))
  )
  with check (
    column_id in (select id from columns where is_board_member(board_id))
  );

create policy "tasks_owner_insert_delete" on tasks for all
  to authenticated
  using (
    column_id in (select id from columns where is_board_owner(board_id))
  )
  with check (
    column_id in (select id from columns where is_board_owner(board_id))
  );

create policy "comments_select" on comments for select
  to authenticated
  using (
    task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      where is_board_member(c.board_id)
    )
  );

create policy "comments_insert" on comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      where is_board_member(c.board_id)
    )
  );

create policy "comments_delete" on comments for delete
  to authenticated
  using (
    user_id = auth.uid()
    or task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      where is_board_owner(c.board_id)
    )
  );

create policy "profiles_select" on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own" on profiles for update
  to authenticated
  using (id = auth.uid());

create policy "attachments_select" on task_attachments for select
  to authenticated
  using (
    task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      where is_board_member(c.board_id)
    )
  );

create policy "attachments_insert" on task_attachments for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      where is_board_member(c.board_id)
    )
  );

create policy "attachments_delete" on task_attachments for delete
  to authenticated
  using (uploaded_by = auth.uid());


create policy "activity_select" on activity_log for select
  to authenticated
  using (is_board_member(board_id));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.log_task_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  select board_id into v_board_id from columns where id = new.column_id;
  insert into activity_log (board_id, user_id, action, event_type, task_id, to_column_id)
  values (v_board_id, auth.uid(), 'created a task', 'task_created', new.id, new.column_id);
  return new;
end;
$$;

create trigger on_task_created
  after insert on tasks
  for each row execute function public.log_task_created();

create or replace function public.log_task_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  select board_id into v_board_id from columns where id = old.column_id;
  insert into activity_log (board_id, user_id, action, event_type, task_id, from_column_id)
  values (v_board_id, auth.uid(), 'deleted a task', 'task_deleted', old.id, old.column_id);
  return old;
end;
$$;

create trigger on_task_deleted
  after delete on tasks
  for each row execute function public.log_task_deleted();

create or replace function public.log_task_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  if old.column_id is distinct from new.column_id then
    select board_id into v_board_id from columns where id = new.column_id;
    insert into activity_log (board_id, user_id, action, event_type, task_id, from_column_id, to_column_id)
    values (v_board_id, auth.uid(), 'moved a task', 'task_moved', new.id, old.column_id, new.column_id);
  end if;
  return new;
end;
$$;

create trigger on_task_moved
  after update of column_id on tasks
  for each row execute function public.log_task_move();

create or replace function public.log_column_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into activity_log (board_id, user_id, action, event_type, from_column_id)
  values (old.board_id, auth.uid(), 'deleted column "' || old.title || '"', 'column_deleted', old.id);
  return old;
end;
$$;

create trigger on_column_deleted
  before delete on columns
  for each row execute function public.log_column_deleted();

create or replace function public.create_board_with_defaults(_title text)
returns boards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board boards;
begin
  insert into boards (title, owner_id)
  values (_title, auth.uid())
  returning * into v_board;

  insert into board_members (board_id, user_id, role)
  values (v_board.id, auth.uid(), 'owner');

  insert into columns (board_id, title, position)
  values
    (v_board.id, 'To Do', 0),
    (v_board.id, 'In Progress', 1),
    (v_board.id, 'Done', 2);

  return v_board;
end;
$$;

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

create policy "attachments_storage_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'task-attachments');

create policy "attachments_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-attachments');

create policy "attachments_storage_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-attachments' and owner = auth.uid());

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table activity_log;