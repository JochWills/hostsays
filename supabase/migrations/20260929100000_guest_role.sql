-- Optional guest accounts (docs/02-business-rules.md → Guests). Own migration: a new enum value
-- can't be used in the transaction that adds it.
alter type public.user_role add value if not exists 'guest';
