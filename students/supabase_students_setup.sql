-- Spark Match student prototype for The Zone
-- Run once in Supabase SQL Editor.
-- Uses the current schema where offers and needs are text[].

alter table public.community_taxonomy
add column if not exists rooms jsonb default '[]'::jsonb;

insert into public.communities (name)
values ('Spark Match - The Zone Students')
on conflict (name) do nothing;

with c as (
  select id from public.communities where name = 'Spark Match - The Zone Students' limit 1
)
insert into public.community_taxonomy (community_id, offers, needs, rooms)
select
  c.id,
  array['ציור ואיור','עיצוב','צילום ועריכה','כתיבה וסיפור','מחקר','תכנות','בניית משחקים','מוזיקה וסאונד','הצגה מול קהל','ארגון והפקה','פתרון בעיות','חשיבה יצירתית','עבודה עם נתונים','שפות','עבודת יד','הובלת קבוצה','משוב','AI']::text[],
  array['רעיון נוסף','מישהו לבנות איתו','ידע שחסר למשימה','משוב על אבטיפוס','עזרה בתכנון','עזרה טכנית','עיצוב','כתיבה','מחקר','צילום ועריכה','בדיקה עם קהל','שמירה על קצב','פתרון תקיעות','הכנה להצגה','חיבור למומחה']::text[],
  '["שולחן בוני משחקים", "מעבדת עיצוב", "חדר סיפור וכתיבה", "פינת צילום ועריכה", "שולחן מחקר", "מעבדת קוד", "חדר משוב", "שולחן הפקה", "חדר בדיקות קהל", "פינת רעיונות"]'::jsonb
from c
where not exists (
  select 1 from public.community_taxonomy t where t.community_id = c.id
);

with c as (
  select id from public.communities where name = 'Spark Match - The Zone Students' limit 1
)
update public.community_taxonomy t
set
  offers = array['ציור ואיור','עיצוב','צילום ועריכה','כתיבה וסיפור','מחקר','תכנות','בניית משחקים','מוזיקה וסאונד','הצגה מול קהל','ארגון והפקה','פתרון בעיות','חשיבה יצירתית','עבודה עם נתונים','שפות','עבודת יד','הובלת קבוצה','משוב','AI']::text[],
  needs = array['רעיון נוסף','מישהו לבנות איתו','ידע שחסר למשימה','משוב על אבטיפוס','עזרה בתכנון','עזרה טכנית','עיצוב','כתיבה','מחקר','צילום ועריכה','בדיקה עם קהל','שמירה על קצב','פתרון תקיעות','הכנה להצגה','חיבור למומחה']::text[],
  rooms = '["שולחן בוני משחקים", "מעבדת עיצוב", "חדר סיפור וכתיבה", "פינת צילום ועריכה", "שולחן מחקר", "מעבדת קוד", "חדר משוב", "שולחן הפקה", "חדר בדיקות קהל", "פינת רעיונות"]'::jsonb
from c
where t.community_id = c.id;

-- Make invites compatible with the current app and legacy schema.
alter table public.invites
add column if not exists sender_profile_id uuid references public.profiles(id) on delete cascade;

alter table public.invites
add column if not exists receiver_profile_id uuid references public.profiles(id) on delete cascade;

alter table public.invites
add column if not exists title text;

alter table public.invites
add column if not exists message text;

alter table public.invites
add column if not exists proposed_times text;

alter table public.invites
add column if not exists status text default 'sent';

alter table public.invites
add column if not exists created_at timestamptz default now();

alter table public.invites
add column if not exists community_id uuid references public.communities(id) on delete cascade;

alter table public.invites
add column if not exists sender_key text;

alter table public.invites
add column if not exists receiver_key text;

alter table public.invites
alter column sender_key drop not null;

alter table public.invites
alter column receiver_key drop not null;

alter table public.invites
alter column sender_key set default '';

alter table public.invites
alter column receiver_key set default '';

notify pgrst, 'reload schema';
