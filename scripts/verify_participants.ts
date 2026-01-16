
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Or service role if needed

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyParticipants() {
    const eventId = '741b4c2b-84ce-4a07-809a-25907f8d7234';

    console.log(`Checking participants for event: ${eventId}`);

    const { data: parts, error } = await supabase
        .from('calendar_event_participants')
        .select('*')
        .eq('event_id', eventId);

    if (error) {
        console.error('Error fetching participants:', error);
        return;
    }

    console.log('Participants found:', parts.length);
    console.log(JSON.stringify(parts, null, 2));
}

verifyParticipants();
