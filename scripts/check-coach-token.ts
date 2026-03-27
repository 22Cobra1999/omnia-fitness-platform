import { createClient } from '@supabase/supabase-js';
import { decrypt } from '/Users/francopomati/omnia-fitness-platform/lib/utils/encryption';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkCoachToken() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: creds, error } = await supabase
        .from('coach_mercadopago_credentials')
        .select('*')
        .eq('mercadopago_user_id', '2995219181')
        .maybeSingle();

    if (error || !creds) {
        console.error('Error fetching creds:', error);
        return;
    }

    try {
        const decryptedToken = decrypt(creds.access_token_encrypted);
        console.log('Coach ID:', creds.coach_id);
        console.log('MP User ID:', creds.mercadopago_user_id);
        console.log('Decrypted Token Prefix:', decryptedToken.substring(0, 30));
        console.log('Full token length:', decryptedToken.length);
        console.log('Matches provided token:', decryptedToken === 'APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181');
    } catch (e) {
        console.error('Decryption failed:', e);
    }
}

checkCoachToken();
