import { createClient } from '@supabase/supabase-js';
import { encrypt } from '/Users/francopomati/omnia-fitness-platform/lib/utils/encryption';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const newToken = 'APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181';
const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

async function updateCoachToken() {
    process.env.ENCRYPTION_KEY = '1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4';
    
    const encryptedToken = encrypt(newToken);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('coach_mercadopago_credentials')
        .update({
            access_token_encrypted: encryptedToken,
            mercadopago_user_id: '2995219181',
            oauth_authorized: true,
            updated_at: new Date().toISOString()
        })
        .eq('coach_id', coachId);

    if (error) {
        console.error('Error updating creds:', error);
    } else {
        console.log('Successfully updated coach credentials in DB.');
    }
}

updateCoachToken();
