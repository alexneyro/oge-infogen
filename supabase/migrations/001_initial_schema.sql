-- Включаем расширение для UUID
create extension if not exists "pgcrypto";

-- PROFILES (расширяет auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text not null,
  email text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  exam_date date,
  streak_current int not null default 0,
  streak_max int not null default 0,
  total_tasks_solved int not null default 0
);

-- CLASSES
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false
);

-- CLASS_MEMBERS
create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- ASSIGNMENTS
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  variant_seed text,
  set_config jsonb,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- ASSIGNMENT_ATTEMPTS
create table public.assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int,
  max_score int,
  answers jsonb,
  time_spent_seconds int,
  unique (assignment_id, student_id)
);

-- SESSIONS (свободные прохождения тренажёра/варианта)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('trainer', 'variant')),
  task_type int,
  variant_seed text,
  score int,
  max_score int,
  answers jsonb,
  time_spent_seconds int,
  created_at timestamptz not null default now()
);

-- ACHIEVEMENTS
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  unlocked_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_attempts enable row level security;
alter table public.sessions enable row level security;
alter table public.achievements enable row level security;
alter table public.notifications enable row level security;

-- profiles: пользователь видит и редактирует только свой профиль
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- classes: учитель видит только свои классы
create policy "classes: teacher owns" on public.classes
  for all using (auth.uid() = teacher_id);

-- class_members: студент видит свои записи; учитель видит всех в своих классах
create policy "class_members: student sees own" on public.class_members
  for select using (auth.uid() = student_id);
create policy "class_members: teacher sees own class" on public.class_members
  for select using (
    exists (
      select 1 from public.classes
      where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
    )
  );
create policy "class_members: teacher manages" on public.class_members
  for all using (
    exists (
      select 1 from public.classes
      where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
    )
  );
create policy "class_members: student insert self" on public.class_members
  for insert with check (auth.uid() = student_id);

-- assignments: учитель управляет своими; студент видит назначенные ему
create policy "assignments: teacher manages" on public.assignments
  for all using (
    exists (
      select 1 from public.classes
      where classes.id = assignments.class_id
      and classes.teacher_id = auth.uid()
    )
  );
create policy "assignments: student sees own" on public.assignments
  for select using (
    exists (
      select 1 from public.class_members
      where class_members.class_id = assignments.class_id
      and class_members.student_id = auth.uid()
    )
  );

-- assignment_attempts: студент управляет своими; учитель видит попытки в своих классах
create policy "attempts: student manages own" on public.assignment_attempts
  for all using (auth.uid() = student_id);
create policy "attempts: teacher sees own class" on public.assignment_attempts
  for select using (
    exists (
      select 1 from public.assignments
      join public.classes on classes.id = assignments.class_id
      where assignments.id = assignment_attempts.assignment_id
      and classes.teacher_id = auth.uid()
    )
  );

-- sessions: только свои
create policy "sessions: own" on public.sessions
  for all using (auth.uid() = user_id);

-- achievements: только свои
create policy "achievements: own" on public.achievements
  for all using (auth.uid() = user_id);

-- notifications: только свои
create policy "notifications: own" on public.notifications
  for all using (auth.uid() = user_id);

-- =====================
-- TRIGGER: auto-create profile on signup
-- =====================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;

$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
