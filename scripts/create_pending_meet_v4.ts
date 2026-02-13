
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

async function createPendingMeet() {
    console.log('--- Creating Pending Meet (Schema Corrected) ---');

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
            event_type: 'consultation',
            created_by_user_id: coachId
        });

    if (eError) {
        console.error('Event error:', eError);
        return;
    }

    // 2. Insert participants using user_id and role
    const { error: pError } = await supabase
        .from('calendar_event_participants')
        .upsert([
            {
                event_id: eventId,
                user_id: coachId,
                role: 'host',
                rsvp_status: 'confirmed',
                payment_status: 'free'
            },
            {
                event_id: eventId,
                user_id: clientId,
                role: 'participant',
                rsvp_status: 'pending', // This should trigger the "Invitación Enviada" logic
                payment_status: 'unpaid'
            }
        ], { onConflict: 'event_id, user_id' }); // Note: constraint might be different, let's checking conflict target

    if (pError) {
        console.error('Participants error:', pError);
        return;
    }

    console.log('✅ Created pending meet with ID:', eventId);
}

createPendingMeet();
