-- Add foreign key constraints to link activities with its related tables
-- This script should be run AFTER all activities, activity_media, activity_program_info,
-- activity_availability, activity_consultation_info, and activity_tags tables are created.

-- Link activity_media to activities
ALTER TABLE public.activity_media
ADD CONSTRAINT fk_activity_media_activity_id
FOREIGN KEY (activity_id) REFERENCES public.activities(id)
ON DELETE CASCADE;

-- Link activity_program_info to activities
ALTER TABLE public.activity_program_info
ADD CONSTRAINT fk_activity_program_info_activity_id
FOREIGN KEY (activity_id) REFERENCES public.activities(id)
ON DELETE CASCADE;

-- Link activity_availability to activities
ALTER TABLE public.activity_availability
ADD CONSTRAINT fk_activity_availability_activity_id
FOREIGN KEY (activity_id) REFERENCES public.activities(id)
ON DELETE CASCADE;

-- Link activity_consultation_info to activities
ALTER TABLE public.activity_consultation_info
ADD CONSTRAINT fk_activity_consultation_info_activity_id
FOREIGN KEY (activity_id) REFERENCES public.activities(id)
ON DELETE CASCADE;

-- Link activity_tags to activities
ALTER TABLE public.activity_tags
ADD CONSTRAINT fk_activity_tags_activity_id
FOREIGN KEY (activity_id) REFERENCES public.activities(id)
ON DELETE CASCADE;

-- Link activity_enrollments to activities
ALTER TABLE public.activity_enrollments
ADD CONSTRAINT fk_activity_enrollments_activity_id
FOREIGN KEY (activity_id) REFERENCES public.activities(id)
ON DELETE RESTRICT;

-- Link activity_enrollments to clients
ALTER TABLE public.activity_enrollments
ADD CONSTRAINT fk_activity_enrollments_client_id
FOREIGN KEY (client_id) REFERENCES public.clients(id)
ON DELETE RESTRICT;

-- Link activities to coaches
ALTER TABLE public.activities
ADD CONSTRAINT fk_activities_coach_id
FOREIGN KEY (coach_id) REFERENCES public.coaches(id)
ON DELETE RESTRICT;

-- Link coaches to user_profiles (coaches.id to user_profiles.id)
ALTER TABLE public.coaches
ADD CONSTRAINT fk_coaches_id_to_user_profiles
FOREIGN KEY (id) REFERENCES public.user_profiles(id)
ON DELETE CASCADE;

-- Link user_profiles to auth.users (user_profiles.id to auth.users.id)
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_id_to_auth_users
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;
