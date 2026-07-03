-- Доски
create table boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- Участники доски
create table board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

-- Колонки
create table columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

-- Задачи
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date    date,
  assignee_id uuid references auth.users(id),
  position    integer not null default 0,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz default now()
);

-- Комментарии (Уровень 2)
create table comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- Профили пользователей
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text
);

-- Включить RLS для всех таблиц
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table profiles enable row level security;

-- Пример: пользователь видит доски, в которых он участник
create policy "Users can view their boards"
  on boards for select
  using (
    id in (select board_id from board_members where user_id = auth.uid())
  );

-- Пример: только owner может удалить доску
create policy "Owner can delete board"
  on boards for delete
  using (owner_id = auth.uid());
