/**
 * Script para verificar la estructura de nutrition_program_details
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    try {
      const envPath = resolve(process.cwd(), envFile);
      const envContent = readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            const cleanValue = value.replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = cleanValue;
            }
          }
        }
      }
    } catch (error: any) {}
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStructure() {
  try {
    // Intentar obtener un registro para ver la estructura
    const { data, error } = await supabase
      .from('nutrition_program_details')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Estructura encontrada:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No hay registros en la tabla');
    }

    // También obtener todos los activity_id únicos
    const { data: allData } = await supabase
      .from('nutrition_program_details')
      .select('activity_id, coach_id')
      .limit(100);

    if (allData) {
      const activityIds = [...new Set(allData.map(d => d.activity_id).filter(id => id !== null))];
      console.log('\nActivity IDs encontrados:', activityIds);
      
      // Verificar cuáles existen en activities
      if (activityIds.length > 0) {
        const { data: existing } = await supabase
          .from('activities')
          .select('id')
          .in('id', activityIds);
        
        const existingIds = new Set(existing?.map(a => a.id) || []);
        const orphaned = activityIds.filter(id => !existingIds.has(id));
        
        console.log('\nActivity IDs existentes:', Array.from(existingIds));
        console.log('Activity IDs huérfanos:', orphaned);
      }
    }

  } catch (error: any) {
    console.error('Error:', error);
  }
}

checkStructure().then(() => process.exit(0));

