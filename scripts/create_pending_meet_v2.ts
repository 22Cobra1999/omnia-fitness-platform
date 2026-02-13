
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

async function createPendingMeet() {
    console.log('--- Creating Pending Meet ---');

    const eventId = uuidv4();
    // Set for tomorrow at 10 AM
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    console.log(`Creating meet for: ${startTime.toISOString()}`);

    // 1. Insert event
    const { error: eError } = await supabase
        .from('calendar_events')
        .insert({
            id: eventId,
            coach_id: coachId,
            title: 'Prueba Invitación Enviada',
            description: 'Meet de prueba creada por script para verificar estado',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'scheduled',
            event_type: 'consultation'
        });

    if (eError) {
        console.error('Event error:', eError);
        return;
    }

    // 2. Insert participants
    // Note: The trigger might auto-add participants, but we want to ensure specific statuses.
    // If the trigger runs, it might add them with default values. 
    // We should upsert to be safe or update if already added.
    // Let's try inserting with upsert just in case the trigger beat us to it (though triggers usually run after)
    // Actually, usually triggers run AFTER the insert, so we might duplicate or conflict if we are not careful.
    // But verify: The trigger 'auto_add_calendar_participants' adds the creator. 
    // Since we are inserting as service role, auth.uid() might be null or not match coachId.
    // Let's just manually insert participants.

    const { error: pError } = await supabase
        .from('calendar_event_participants')
        .upsert([
            {
                event_id: eventId,
                client_id: coachId,
                participant_role: 'coach',
                rsvp_status: 'confirmed',
                payment_status: 'free'
            },
            {
                event_id: eventId,
                client_id: clientId,
                participant_role: 'client',
                rsvp_status: 'pending', // This is what triggers "Invitación Enviada"
                payment_status: 'unpaid'
            }
        ], { onConflict: 'event_id, client_id' }); // Assuming there's a unique constraint/index

    if (pError) {
        console.error('Participants error:', pError);
        return;
    }

    console.log('✅ Created pending meet with ID:', eventId);
}

createPendingMeet();
