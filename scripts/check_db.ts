import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { error: err2 } = await supabase.from('periodos').upsert({ actividad_id: 1, cantidad_periodos: 1 }, { onConflict: 'actividad_id' });
  console.log('periodos error:', err2);
  
  const { error: err3 } = await supabase.from('planificacion_ejercicios').upsert({ actividad_id: 1, numero_semana: 1, lunes: {} }, { onConflict: 'actividad_id, numero_semana' });
  console.log('planificacion_ejercicios upsert error:', err3);
}
check();
