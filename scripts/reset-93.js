const { createClient } = require('@supabase/supabase-js');

async function resetActivity() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing env vars');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    const activityId = 93;

    console.log(`🔄 Resetting Activity ${activityId} for Client ${clientId}...`);

    // 1. Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
        .from('activity_enrollments')
        .select('id')
        .eq('client_id', clientId)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (enrollmentError || !enrollment) {
        console.error('❌ Enrollment not found:', enrollmentError);
        return;
    }

    console.log(`✅ Found enrollment: ${enrollment.id}`);

    // 2. Set start_date to NULL
    const { error: updateError } = await supabase
        .from('activity_enrollments')
        .update({ start_date: null })
        .eq('id', enrollment.id);

    if (updateError) {
        console.error('❌ Error updating start_date:', updateError);
    } else {
        console.log('✅ start_date set to NULL');
    }

    // 3. Delete progress records
    const { error: deleteError } = await supabase
        .from('progreso_cliente_nutricion')
        .delete()
        .eq('enrollment_id', enrollment.id);

    if (deleteError) {
        console.warn('⚠️ Error deleting progress (might not exist):', deleteError);
    } else {
        console.log('✅ Progress records cleared');
    }

    // Also try legacy activity_id delete
    await supabase
        .from('progreso_cliente_nutricion')
        .delete()
        .eq('cliente_id', clientId)
        .eq('actividad_id', activityId);

    console.log('🚀 Reset complete! Now user should see "Empezar actividad" modal.');
}

resetActivity();
