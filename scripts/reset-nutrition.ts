import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

async function findAndResetNutritionEnrollment() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Get all enrollments for Nutrition activities
    const { data: enrollments, error } = await supabase
        .from('activity_enrollments')
        .select('*, activity:activities!activity_enrollments_activity_id_fkey(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching enrollments:', error);
        return;
    }

    // Filter by Nutrition type
    const nutritionEnrollments = enrollments.filter(e => 
        (e as any).activity.type?.toLowerCase().includes('nutri') || 
        (e as any).activity.categoria?.toLowerCase().includes('nutri')
    );

    if (nutritionEnrollments.length === 0) {
        console.log('No nutrition enrollments found.');
        return;
    }

    console.log(`Found ${nutritionEnrollments.length} nutrition enrollments.`);

    // Take the most recent one (presumably the one the user is talking about)
    const target = nutritionEnrollments[0];
    console.log(`Targeting Enrollment ID: ${target.id}, Activity: ${target.activity.title}, Start Date: ${target.start_date}`);

    // 2. Reset enrollment
    const { error: updateError } = await supabase
        .from('activity_enrollments')
        .update({
            start_date: null,
            program_end_date: null,
            status: 'activa' // or 'pendiente'? The previous agent said 'activa' is fine as long as start_date is null
        } as any)
        .eq('id', target.id);

    if (updateError) {
        console.error('Error resetting enrollment:', updateError);
        return;
    }

    // 3. Delete progress
    const { error: deleteError } = await supabase
        .from('progreso_cliente_nutricion')
        .delete()
        .eq('enrollment_id', target.id);

    if (deleteError) {
        console.error('Error deleting progress:', deleteError);
    } else {
        console.log('Successfully deleted progress records for nutrition.');
    }

    // 4. Delete PDA summary
    const { error: pdaError } = await supabase
        .from('progreso_diario_actividad')
        .delete()
        .eq('enrollment_id', target.id);
    
    if (pdaError) {
        console.warn('PDA summary deletion skipped or failed (might be expected):', pdaError.message);
    } else {
        console.log('✅ Daily summary (PDA) also deleted.');
    }

    console.log(`✅ Reset complete for activity: ${target.activity.title}`);
}

findAndResetNutritionEnrollment();
