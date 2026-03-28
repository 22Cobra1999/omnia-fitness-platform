import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/Users/francopomati/omnia-fitness-platform/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseIngredientString(s: string) {
    if (!s || s === "" || s === '""') return null;
    const regex = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(.*)$/i;
    const match = s.trim().match(regex);
    if (match) {
        return {
            nombre: match[1].trim(),
            cantidad: parseFloat(match[2]),
            unidad: match[3].trim() || 'u'
        };
    }
    return { nombre: s.trim(), cantidad: 1, unidad: 'u' };
}


async function repairNutritionProgress(enrollmentId?: number) {
    console.log(`🚀 Iniciando reparación de progreso nutricional... ${enrollmentId ? `para enrollment ${enrollmentId}` : 'para TODOS los enrollments'}`);

    // 1. Obtener los registros de progreso que necesitan reparación
    let query = supabase.from('progreso_cliente_nutricion').select('*');
    if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
    }

    const { data: records, error } = await query;
    if (error) {
        console.error('❌ Error al obtener registros:', error);
        return;
    }

    console.log(`📦 Encontrados ${records?.length || 0} registros.`);

    for (const record of (records || [])) {
        const macros = record.macros || {};
        const plateIds = Object.keys(macros).map(Number).filter(n => !isNaN(n));

        if (plateIds.length === 0) continue;

        // 2. Obtener detalles reales desde la DB (incluyendo join con recetas)
        const { data: plates, error: pError } = await supabase
            .from('nutrition_program_details')
            .select(`
                id, 
                nombre, 
                receta_id, 
                calorias, 
                proteinas, 
                carbohidratos, 
                grasas, 
                ingredientes, 
                minutos,
                recetas (
                  receta,
                  nombre
                )
            `)
            .in('id', plateIds);

        if (pError || !plates) {
            console.error(`❌ Error al obtener detalles de platos para registro ${record.id}:`, pError);
            continue;
        }

        const newMacros = { ...macros };
        const newIngredientes = record.ingredientes || {};
        const newRecetas = record.recetas || {};
        let updated = false;

        plates.forEach(p => {
            const rawIngs = (p.ingredientes && Array.isArray(p.ingredientes) && p.ingredientes.length > 0 && p.ingredientes?.[0] !== "")
                ? p.ingredientes
                : (p.ingredientes || []);
            
            const parsedIngs = rawIngs.map((s: string) => parseIngredientString(s)).filter((i: any) => i !== null);

            // Migrar a nuevo formato macro (sin receta text, con ids)
            if (newMacros[p.id]) {
                const currentIng = newMacros[p.id].ingredientes;
                const isLegacy = currentIng && Array.isArray(currentIng) && currentIng.length > 0 && typeof currentIng[0] === 'string';
                
                if (isLegacy || newMacros[p.id].receta || newMacros[p.id].receta_id !== p.receta_id) {
                    newMacros[p.id].receta = undefined; // Quitar texto
                    newMacros[p.id].receta_id = p.receta_id;
                    newMacros[p.id].ingredientes = parsedIngs;
                    updated = true;
                }
            }
            
            // Migrar ingredients bucket
            const isLegacyBucket = newIngredientes[p.id] && Array.isArray(newIngredientes[p.id]) && newIngredientes[p.id].length > 0 && typeof newIngredientes[p.id][0] === 'string';
            if (isLegacyBucket || !newIngredientes[p.id]) {
                newIngredientes[p.id] = parsedIngs;
                updated = true;
            }

            // Migrar recipes bucket (solo ID)
            if (newRecetas[p.id] !== p.receta_id) {
                newRecetas[p.id] = p.receta_id;
                updated = true;
            }
        });


        if (updated) {
            const { error: uError } = await supabase
                .from('progreso_cliente_nutricion')
                .update({
                    macros: newMacros,
                    ingredientes: newIngredientes,
                    recetas: newRecetas
                })
                .eq('id', record.id);

            if (uError) {
                console.error(`❌ Error al actualizar registro ${record.id}:`, uError.message);
            } else {
                console.log(`✅ Registro ${record.id} (${record.fecha}) reparado.`);
            }
        }
    }

    console.log('🏁 Proceso de reparación finalizado.');
}

// Ejemplo: Ejecutar para enrollment 215
const targetEnrollment = process.argv[2] ? parseInt(process.argv[2]) : 215;
repairNutritionProgress(targetEnrollment);
