
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

async function checkParticipants() {
    console.log('--- Checking Participants for Coach:', coachId);

    // Get latest matches
    const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('id, title, start_time')
        .eq('coach_id', coachId)
        .order('start_time', { ascending: false })
        .limit(10);

    if (eventsError) {
        console.error('Events error:', eventsError);
        return;
    }

    const eventIds = events.map(e => e.id);

    const { data: participants, error: pError } = await supabase
        .from('calendar_event_participants')
        .select('*')
        .in('event_id', eventIds);

    if (pError) {
        console.error('Participants error:', pError);
        return;
    }

    events.forEach(e => {
        const parts = participants.filter(p => p.event_id === e.id);
        console.log(`Event: ${e.title} (${e.id}) - ${e.start_time}`);
        parts.forEach(p => {
            console.log(`  - P: ${p.client_id} | Role: ${p.participant_role} | Status: ${p.rsvp_status}`);
        });
    });
}

checkParticipants();
