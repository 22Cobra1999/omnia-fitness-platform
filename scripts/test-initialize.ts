import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testInitialize() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const enrollmentId = 215;
    const clientId = 'f892a061-f050-482d-88ba-0a3f65243169'; // Need to find real client ID
    const activityId = 93;
    const startDate = '2026-06-01'; // Future Monday

    // Update enrollment start_date first to simulate what the app does
    await supabase.from('activity_enrollments').update({ start_date: startDate } as any).eq('id', enrollmentId);

    console.log(`Calling initialize-progress for Activity ${activityId}, Enrollment ${enrollmentId}, Start ${startDate}`);

    const response = await fetch('http://localhost:3000/api/activities/initialize-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            activityId: activityId,
            clientId: clientId,
            startDate: startDate,
            enrollmentId: enrollmentId
        })
    });

    const result = await response.json();
    console.log('Result:', result);

    if (result.success) {
        // Check records in progreso_cliente_nutricion
        const {data: recs} = await supabase.from('progreso_cliente_nutricion').select('*').eq('enrollment_id', enrollmentId);
        console.log(`Created ${recs?.length || 0} progress records.`);
    }
}

// Find real client ID first
async function run() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const {data} = await supabase.from('activity_enrollments').select('client_id, activity_id').eq('id', 215).single();
    if (data) {
        const clientId = data.client_id;
        const activityId = data.activity_id;
        // Proceed with test
        const enrollmentId = 215;
        const startDate = '2026-06-01'; // Future Monday

        await supabase.from('activity_enrollments').update({ start_date: startDate } as any).eq('id', enrollmentId);
        console.log(`Calling initialize-progress for Activity ${activityId}, Enrollment ${enrollmentId}, Client ${clientId}, Start ${startDate}`);

        const response = await fetch('http://localhost:3000/api/activities/initialize-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activityId: activityId.toString(),
                clientId: clientId,
                startDate: startDate,
                enrollmentId: enrollmentId
            })
        });

        const result = await response.json();
        console.log('Result:', result);

        if (result.success) {
            const {data: recs} = await supabase.from('progreso_cliente_nutricion').select('*').eq('enrollment_id', enrollmentId);
            console.log(`Created ${recs?.length || 0} progress records.`);
        }
    }
}

run();
