
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase keys')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixCalendarData() {
    console.log('🚀 Starting Calendar Data Fix...')

    // 1. Standardize RSVP: 'confirmed' -> 'accepted'
    console.log('\n--- 1. Standardizing RSVP to "accepted" ---')
    const { data: confirmedParticipants, error: error1 } = await supabase
        .from('calendar_event_participants')
        .select('id, rsvp_status')
        .eq('rsvp_status', 'confirmed')

    if (error1) console.error('Error fetching confirmed participants:', error1)
    else {
        console.log(`Found ${confirmedParticipants.length} participants with 'confirmed' status.`)
        if (confirmedParticipants.length > 0) {
            const { error: updateError } = await supabase
                .from('calendar_event_participants')
                .update({ rsvp_status: 'accepted' })
                .eq('rsvp_status', 'confirmed')

            if (updateError) console.error('Error updating RSVP:', updateError)
            else console.log('✅ Updated all to "accepted".')
        }
    }

    // 2. Fix Creator Flag
    console.log('\n--- 2. Fixing is_creator Flag ---')
    const { data: creatorCandidates, error: error2 } = await supabase
        .from('calendar_event_participants')
        .select('id, user_id, invited_by_user_id')
        .eq('is_creator', false)
        .not('invited_by_user_id', 'is', null)

    if (error2) console.error('Error fetching creator candidates:', error2)
    else {
        const toFix = creatorCandidates.filter(p => p.user_id === p.invited_by_user_id)
        console.log(`Found ${toFix.length} participants that should be creators.`)

        for (const p of toFix) {
            await supabase
                .from('calendar_event_participants')
                .update({ is_creator: true })
                .eq('id', p.id)
        }
        console.log('✅ Fixed is_creator flags.')
    }

    // 3. Fix Creator Pending RSVP
    console.log('\n--- 3. Fixing Creator Pending RSVP ---')
    const { data: pendingCreators, error: error3 } = await supabase
        .from('calendar_event_participants')
        .select('id')
        .eq('is_creator', true)
        .eq('rsvp_status', 'pending')

    if (error3) console.error('Error fetching pending creators:', error3)
    else {
        console.log(`Found ${pendingCreators.length} creators with pending status.`)
        if (pendingCreators.length > 0) {
            await supabase
                .from('calendar_event_participants')
                .update({ rsvp_status: 'accepted' })
                .in('id', pendingCreators.map(p => p.id))
            console.log('✅ Auto-accepted creators.')
        }
    }

    // 4. Update Event Status to 'scheduled' if all participants accepted
    console.log('\n--- 4. Updating Event Status to "scheduled" ---')
    const { data: pendingEvents, error: error4 } = await supabase
        .from('calendar_events')
        .select(`
            id, 
            title,
            participants:calendar_event_participants(id, rsvp_status)
        `)
        .eq('status', 'pending')

    if (error4) console.error('Error fetching pending events:', error4)
    else {
        console.log(`Found ${pendingEvents.length} pending events. Checking participation...`)
        let fixedCount = 0
        for (const event of pendingEvents) {
            const { data: freshParts } = await supabase
                .from('calendar_event_participants')
                .select('rsvp_status')
                .eq('event_id', event.id)

            const parts = freshParts || []
            const hasPending = parts.some(p => p.rsvp_status === 'pending')
            const hasAccepted = parts.some(p => p.rsvp_status === 'accepted')

            if (!hasPending && hasAccepted) {
                console.log(`-> Fixing event "${event.title}" to scheduled...`)
                await supabase
                    .from('calendar_events')
                    .update({ status: 'scheduled' })
                    .eq('id', event.id)
                fixedCount++
            }
        }
        console.log(`✅ Fixed ${fixedCount} events.`)
    }

    // 5. Sync Cancelled Events
    console.log('\n--- 5. Syncing Cancelled Events ---')
    const { data: cancelledParts, error: error5 } = await supabase
        .from('calendar_event_participants')
        .select('event_id, rsvp_status')
        .in('rsvp_status', ['cancelled', 'declined'])

    if (error5) console.error('Error fetching cancelled participants:', error5)
    else {
        const uniqueEventIds = [...new Set(cancelledParts.map(p => p.event_id))]
        console.log(`Found ${uniqueEventIds.length} potentially cancelled events.`)
        for (const eid of uniqueEventIds) {
            await supabase
                .from('calendar_events')
                .update({ status: 'cancelled' })
                .eq('id', eid)
                .neq('status', 'cancelled')
        }
        console.log('✅ Cancelled events synced.')
    }

    console.log('\n🚀 Fix Complete!')
}

fixCalendarData()
