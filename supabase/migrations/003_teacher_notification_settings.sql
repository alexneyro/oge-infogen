ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_interval text NOT NULL DEFAULT 'instant'
CHECK (notification_interval IN ('instant', 'daily', 'weekly', 'never'));
