
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleOAuth } from '../lib/google/oauth';
import { GoogleMeet } from '../lib/google/meet';

// 1. Manually load environment variables from .env.local
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });
  console.log('✅ Environment variables loaded from .env.local');
} catch (e) {
  console.error('❌ Could not load .env.local');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runDiagnosis() {
  console.log('\n🔍 Starting Google Meet Integration Diagnosis...\n');

  // 1. Check Google Client ID/Secret
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (clientId) {
    console.log(`✅ GOOGLE_CLIENT_ID is set: ${clientId.substring(0, 15)}...`);
  } else {
    console.error('❌ GOOGLE_CLIENT_ID is NOT set');
  }

  if (clientSecret) {
    console.log(`✅ GOOGLE_CLIENT_SECRET is set: ${clientSecret.substring(0, 5)}...`);
  } else {
    console.error('❌ GOOGLE_CLIENT_SECRET is NOT set');
  }

  // 2. Check for a coach with tokens
  const { data: tokens, error: tokensError } = await supabase
    .from('google_oauth_tokens')
    .select('coach_id, refresh_token, scope, expires_at')
    .limit(1);

  if (tokensError || !tokens || tokens.length === 0) {
    console.error('❌ No entries found in google_oauth_tokens. Cannot test API calls.');
    console.log('💡 Note: You need at least one coach to connect their Google account.');
  } else {
    const token = tokens[0];
    console.log(`✅ Found test coach tokens (Coach ID: ${token.coach_id})`);
    console.log(`   Scopes: ${token.scope}`);

    // Check if scopes includes meetings.conference.readonly
    if (token.scope && token.scope.includes('meetings.conference.readonly')) {
      console.log('   ✅ Scope "meetings.conference.readonly" IS present in DB');
    } else if (token.scope && token.scope.includes('meetings.space')) {
        console.log('   ⚠️  Scope "meetings.conference.readonly" is NOT in DB (User needs to reconnect)');
    } else {
      console.log('   ❌ No Meet scopes found in token');
    }

    // Attempt token refresh
    try {
      console.log(`\n🔄 Testing Token Refresh for coach ${token.coach_id}...`);
      const refreshed = await GoogleOAuth.refreshAccessToken(token.refresh_token);
      console.log('   ✅ Token refresh successful!');
      const accessToken = refreshed.access_token;

      // 3. Test Google Meet API connectivity
      console.log('\n📅 Testing Google Meet API connectivity...');
      try {
        // Find a recent event with a meet link to test attendance
        const { data: recentEvents } = await supabase
            .from('calendar_events')
            .select('id, title, google_meet_data')
            .eq('coach_id', token.coach_id)
            .not('google_meet_data', 'is', null)
            .order('start_time', { ascending: false })
            .limit(1);

        if (recentEvents && recentEvents.length > 0 && recentEvents[0].google_meet_data?.meet_link) {
            const meetLink = recentEvents[0].google_meet_data.meet_link;
            console.log(`   Testing attendance fetch for meeting: ${meetLink}`);
            const stats = await GoogleMeet.getAttendanceStats(accessToken, meetLink);
            console.log(`   ✅ Attendance Stats API Call Successful!`);
            console.log(`   Found ${stats.size} participants in Meet records.`);
            stats.forEach((data, participantName) => {
                console.log(`      - ${participantName}: ${data.minutes} mins (${data.email || 'No email'})`);
            });
        } else {
            console.log('   ⚠️  No recent events with Meet links found for this coach to test attendance stats.');
            // Fallback: Just try to list spaces or something simple
            const response = await fetch('https://meet.googleapis.com/v2/conferenceRecords', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                console.log('   ✅ Google Meet API (v2) is reachable and authorized.');
            } else {
                const err = await response.text();
                console.error(`   ❌ Google Meet API Call failed: ${response.status} ${err}`);
            }
        }
      } catch (meetErr: any) {
        console.error(`   ❌ Google Meet API test failed: ${meetErr.message}`);
      }

    } catch (refreshErr: any) {
      console.error(`   ❌ Token refresh failed: ${refreshErr.message}`);
      console.log('   💡 This usually means the refresh_token is invalid or the client secret is wrong.');
    }
  }

  // 4. Check DB Schema
  console.log('\n📊 Checking Database Schema for attendance columns...');
  const { data: cols, error: colsErr } = await supabase.rpc('debug_get_table_columns', { 
    target_table: 'calendar_event_participants' 
  });

  if (!colsErr && cols) {
    const colNames = cols.map((c: any) => c.column_name);
    if (colNames.includes('attendance_status')) {
      console.log('   ✅ Column "attendance_status" exists.');
    } else {
      console.error('   ❌ Column "attendance_status" is MISSING.');
    }
    if (colNames.includes('attendance_minutes')) {
      console.log('   ✅ Column "attendance_minutes" exists.');
    } else {
      console.error('   ❌ Column "attendance_minutes" is MISSING.');
    }
  } else {
    // Fallback if RPC doesn't exist
    const { error: selectErr } = await supabase
      .from('calendar_event_participants')
      .select('attendance_status, attendance_minutes')
      .limit(1);
    
    if (selectErr) {
       console.error(`   ❌ DB Schema verification failed: ${selectErr.message}`);
    } else {
       console.log('   ✅ Attendance columns verified via SELECT.');
    }
  }

  console.log('\n🏁 Diagnosis Finished.\n');
}

runDiagnosis();
