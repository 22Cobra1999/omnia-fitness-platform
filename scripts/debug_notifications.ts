
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Or SERVICE_ROLE if needed, but Modal uses client/anon usually. 
// However, since I don't have user session, RLS might block me if I use ANON. 
// I should use SERVICE_ROLE for debugging to see if data EXISTS first, then reason about RLS.
// Actually, if RLS is the issue, I can't easily reproduce it without login.
// But earlier I used ANON and saw 0 participants.
// Let's use SERVICE_ROLE to verify data existence first.

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

async function debugNotifications() {
    console.log('--- Debugging Notifications for Coach:', coachId, '---');

    // 1. Fetch Events
    const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time, meet_link')
        .eq('coach_id', coachId)
        .eq('event_type', 'consultation')
        .gt('start_time', new Date().toISOString()) // Future events roughly
        .limit(10);

    if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
    }
    console.log(`Found ${events?.length} future consultation events.`);
    if (events && events.length > 0) {
        console.log('Sample Event:', events[0]);
    }

    const eventIds = (events || []).map(e => e.id);
    if (eventIds.length === 0) {
        console.log('No future events found. Exiting.');
        return;
    }

    // 2. Fetch Participants
    console.log('Fetching participants for event IDs:', eventIds);
    const { data: parts, error: partsError } = await supabase
        .from('calendar_event_participants')
        .select('event_id, client_id, rsvp_status, updated_at, participant_role')
        .in('event_id', eventIds)
        .order('updated_at', { ascending: false })
        .limit(50);

    if (partsError) {
        console.error('Error fetching participants:', partsError);
        return;
    }

    console.log(`Found ${parts?.length} participants.`);
    if (parts && parts.length > 0) {
        console.log('Participants:', JSON.stringify(parts, null, 2));

        const pending = parts.filter(p => p.rsvp_status === 'pending');
        console.log(`Pending participants: ${pending.length}`);
    } else {
        // Check deeper logic: Does the table have rows for these events at all?
        // Maybe I should query without limit/order to be sure.
        const { count } = await supabase
            .from('calendar_event_participants')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds);
        console.log(`Total count in DB for these ids: ${count}`);
    }

    // 3. Check Reschedule Requests
    console.log('Checking Reschedule Requests for events:', eventIds);
    const { data: reschedules, error: rrError } = await supabase
        .from('calendar_event_reschedule_requests')
        .select('*')
        .in('event_id', eventIds)
        .eq('status', 'pending');

    if (rrError) {
        console.error('Error fetching reschedules:', rrError);
    } else {
        console.log(`Found ${reschedules?.length} pending reschedules.`);
        if (reschedules && reschedules.length > 0) {
            console.log(JSON.stringify(reschedules, null, 2));
        }
    }
}

debugNotifications();
