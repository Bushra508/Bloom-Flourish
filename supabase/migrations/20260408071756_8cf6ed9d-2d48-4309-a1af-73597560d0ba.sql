-- Drop the unique constraint on (user_id, name) to allow multiple scans per plant
ALTER TABLE public.plants DROP CONSTRAINT IF EXISTS plants_user_id_name_key;