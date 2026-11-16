-- Добавляем новые поля
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Переносим данные из display_name: первое слово → first_name, остальное → last_name
update public.profiles
set
  first_name = split_part(display_name, ' ', 1),
  last_name = nullif(trim(substring(display_name from position(' ' in display_name) + 1)), '');

-- Делаем поля обязательными (после заполнения данных)
alter table public.profiles
  alter column first_name set not null,
  alter column first_name set default '',
  alter column last_name set not null,
  alter column last_name set default '';

-- Обновляем триггер чтобы использовал новые поля
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, display_name, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  return new;
end;

$$;
