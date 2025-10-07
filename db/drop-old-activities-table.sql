-- WARNING: This script will permanently delete the 'activities' table and all its data.
-- Ensure you have successfully migrated all necessary data to the new tables
-- (activities_base, activity_availability, activity_consultation_info, activity_program_info, activity_media, activity_tags)
-- BEFORE running this script.
-- WARNING: Only run this script AFTER you have successfully migrated all data
-- from the old 'activities' table to the new normalized tables
-- (activities_base, activity_availability, activity_consultation_info,
-- activity_program_info, activity_media, activity_tags)
-- Drop the old 'activities' table only after successful migration and verification
DROP TABLE IF EXISTS public.activities CASCADE;
</merged_code>
