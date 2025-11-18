/**
 * Script para recuperar actividad de nutrición borrada
 * Usa los datos de nutrition_program_details para recrear la actividad
 * Ejecutar con: npx tsx scripts/recover-nutrition-activity.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
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
    } catch (error: any) {
      // Ignorar si el archivo no existe
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recoverNutritionActivity() {
  try {
    console.log('🔍 Buscando actividades de nutrición huérfanas...\n');

    // 1. Buscar todos los registros en nutrition_program_details
    const { data: allNutrition, error: allError } = await supabase
      .from('nutrition_program_details')
      .select('activity_id, coach_id, created_at, updated_at, nombre, calorias, proteinas, carbohidratos, grasas, receta')
      .order('created_at', { ascending: false })
      .limit(1000); // Limitar para evitar problemas de memoria

    if (allError) {
      console.error('❌ Error consultando nutrition_program_details:', allError);
      return;
    }

    if (!allNutrition || allNutrition.length === 0) {
      console.log('ℹ️  No se encontraron registros en nutrition_program_details');
      return;
    }

    console.log(`📊 Encontrados ${allNutrition.length} registros en nutrition_program_details\n`);

    // 2. Agrupar por activity_id para encontrar los huérfanos
    const activityIds = [...new Set(allNutrition.map(n => n.activity_id).filter(id => id !== null))];
    console.log(`📊 Encontrados ${activityIds.length} activity_id(s) únicos en nutrition_program_details\n`);

    // 3. Verificar cuáles activity_id no existen en activities
    const { data: existingActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .in('id', activityIds);

    if (activitiesError) {
      console.error('❌ Error consultando activities:', activitiesError);
      return;
    }

    const existingIds = new Set(existingActivities?.map(a => a.id) || []);
    const orphanedIds = activityIds.filter(id => !existingIds.has(id));

    if (orphanedIds.length === 0) {
      console.log('✅ Todas las actividades existen. No hay actividades huérfanas.\n');
      return;
    }

    console.log(`⚠️  Encontradas ${orphanedIds.length} actividad(es) huérfana(s):\n`);
    console.log('IDs huérfanos:', orphanedIds.join(', '), '\n');

    // 4. Para cada actividad huérfana, obtener información
    for (const orphanedId of orphanedIds) {
      console.log(`\n📋 Procesando actividad huérfana ID: ${orphanedId}`);
      
      // Obtener datos de nutrition_program_details para este activity_id
      const { data: nutritionData, error: nutritionError } = await supabase
        .from('nutrition_program_details')
        .select('*')
        .eq('activity_id', orphanedId)
        .order('created_at', { ascending: true });

      if (nutritionError || !nutritionData || nutritionData.length === 0) {
        console.log(`   ⚠️  No se encontraron datos de nutrición para activity_id ${orphanedId}`);
        continue;
      }

      const firstRecord = nutritionData[0];
      const coachId = firstRecord.coach_id;

      if (!coachId) {
        console.log(`   ⚠️  No se encontró coach_id para activity_id ${orphanedId}`);
        continue;
      }

      console.log(`   👤 Coach ID: ${coachId}`);
      console.log(`   🍽️  Platos encontrados: ${nutritionData.length}`);

      // Obtener información del coach
      const { data: coachData } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('id', coachId)
        .single();

      console.log(`   👨‍💼 Coach: ${coachData?.full_name || 'Desconocido'}`);

      // Calcular estadísticas de los platos
      const totalCalorias = nutritionData.reduce((sum, n) => sum + (parseFloat(n.calorias?.toString() || '0') || 0), 0);
      const promedioCalorias = nutritionData.length > 0 ? totalCalorias / nutritionData.length : 0;
      const totalProteinas = nutritionData.reduce((sum, n) => sum + (parseFloat(n.proteinas?.toString() || '0') || 0), 0);
      const totalCarbohidratos = nutritionData.reduce((sum, n) => sum + (parseFloat(n.carbohidratos?.toString() || '0') || 0), 0);

      console.log(`   🔥 Total de calorías: ${totalCalorias.toFixed(0)}`);
      console.log(`   🔥 Promedio de calorías por plato: ${promedioCalorias.toFixed(0)}`);
      console.log(`   🥩 Total de proteínas: ${totalProteinas.toFixed(0)}g`);
      console.log(`   🍞 Total de carbohidratos: ${totalCarbohidratos.toFixed(0)}g`);

      // 5. Crear nueva actividad
      console.log(`\n   🔨 Creando nueva actividad...`);
      
      // Generar título basado en los platos
      const platosUnicos = [...new Set(nutritionData.map(n => n.nombre).filter(n => n))];
      const tituloSugerido = platosUnicos.length > 0 
        ? `Programa de Nutrición - ${platosUnicos.slice(0, 3).join(', ')}${platosUnicos.length > 3 ? '...' : ''}`
        : `Programa de Nutrición Recuperado`;

      const newActivity = {
        title: tituloSugerido,
        description: `Programa de nutrición recuperado con ${nutritionData.length} plato(s). Incluye ${platosUnicos.length} recetas diferentes.`,
        type: 'nutrition_program',
        categoria: 'nutricion',
        difficulty: 'intermediate',
        price: 1000, // Precio por defecto, se puede ajustar después
        coach_id: coachId,
        is_public: true,
        dias_acceso: 30,
        created_at: firstRecord.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdActivity, error: createError } = await supabase
        .from('activities')
        .insert(newActivity)
        .select()
        .single();

      if (createError || !createdActivity) {
        console.error(`   ❌ Error creando actividad:`, createError);
        continue;
      }

      console.log(`   ✅ Actividad creada con ID: ${createdActivity.id}`);

      // 6. Actualizar nutrition_program_details con el nuevo activity_id
      console.log(`   🔄 Actualizando ${nutritionData.length} platos con nuevo activity_id...`);
      
      const { error: updateError } = await supabase
        .from('nutrition_program_details')
        .update({ activity_id: createdActivity.id })
        .eq('activity_id', orphanedId);

      if (updateError) {
        console.error(`   ❌ Error actualizando platos:`, updateError);
        // No eliminar la actividad creada, pero avisar
        console.log(`   ⚠️  La actividad ${createdActivity.id} fue creada pero los platos no se actualizaron.`);
        console.log(`   ⚠️  Necesitas actualizar manualmente: UPDATE nutrition_program_details SET activity_id = ${createdActivity.id} WHERE activity_id = ${orphanedId} AND client_id IS NULL;`);
      } else {
        console.log(`   ✅ Platos actualizados correctamente`);
      }

      console.log(`\n   📝 Resumen:`);
      console.log(`      - Nueva actividad ID: ${createdActivity.id}`);
      console.log(`      - Título: ${createdActivity.title}`);
      console.log(`      - Platos recuperados: ${nutritionData.length}`);
      console.log(`      - Coach: ${coachData?.full_name || coachId}`);
      console.log(`\n   💡 Puedes editar el título y precio de la actividad desde la interfaz.`);
    }

    console.log('\n✅ Proceso de recuperación completado\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

recoverNutritionActivity()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

