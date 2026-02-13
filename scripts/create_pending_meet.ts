
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

async function createPendingMeet() {
    console.log('--- Creating Pending Meet ---');

    const eventId = uuidv4();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1); // Tomorrow
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    // 1. Insert event
    const { error: eError } = await supabase
        .from('calendar_events')
        .insert({
            id: eventId,
            coach_id: coachId,
            title: 'Meet Prueba Invitación',
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
    const { error: pError } = await supabase
        .from('calendar_event_participants')
        .insert([
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
                rsvp_status: 'pending',
                payment_status: 'unpaid'
            }
        ]);

    if (pError) {
        console.error('Participants error:', pError);
        return;
    }

    console.log('✅ Created pending meet with ID:', eventId);
}

createPendingMeet();
