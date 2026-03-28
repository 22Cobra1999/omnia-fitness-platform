import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgrfswrsvrzwtgilssad.supabase.co';
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


async function simulateGeneration() {
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    const activityId = 93;
    const plateIds = [753, 758, 759, 760, 761, 764, 765, 773, 772, 771];

    console.log('--- SIMULACIÓN DE GENERACIÓN DE PROGRESO NUTRICIÓN ---');

    // 1. Get Client Profile
    const { data: profile } = await supabase.from('client_full_profile').select('*').eq('client_id', clientId).single();
    console.log('👤 Perfil encontrado:', profile?.gender, profile?.current_weight, 'kg');

    // 2. Get Plates Details
    const { data: plates } = await supabase
        .from('nutrition_program_details')
        .select(`
            *,
            recetas (
                receta,
                nombre
            )
        `)
        .in('id', plateIds);
    
    console.log(`📖 Platos encontrados en DB: ${plates?.length || 0}`);
    if (!plates || plates.length === 0) {
        console.error('❌ ERROR: No se encontraron platos en nutrition_program_details.');
        return;
    }

    // 3. Get Rules (Catalog)
    const { data: actBase } = await supabase.from('activities').select('adaptive_rule_ids').eq('id', activityId).single();
    const { data: catalogRules } = await supabase.from('adaptive_rules_catalog').select('*').in('id', actBase?.adaptive_rule_ids || []);
    
    // 4. Get Coach Rules
    const { data: coachRules } = await supabase.from('product_conditional_rules').select('*').eq('is_active', true);

    // Filter relevant coach rules
    const targetCoachRules = (coachRules || []).filter(r => !r.target_product_ids || r.target_product_ids.includes(activityId));

    // Calculate Factors
    const gender = (profile?.gender || 'male').toLowerCase();
    const bmi = (profile?.current_weight && profile?.current_height) ? profile.current_weight / Math.pow(profile.current_height/100, 2) : 24;
    const age = 30; // placeholder if no birthdate

    let factorKcal = 1.0;
    let factorProt = 1.0;

    catalogRules?.forEach(r => {
        const name = (r.name || '').toLowerCase();
        if (r.category === 'gender' && name.includes(gender)) {
             factorKcal *= (r.kcal || 1.0);
             factorProt *= (r.proteina || 1.0);
        }
    });

    targetCoachRules.forEach(r => {
        const c = r.criteria;
        if (c.gender && c.gender !== 'all' && c.gender.toLowerCase() !== gender) return;
        const portionInc = (r.adjustments?.portions || 0) / 100;
        factorKcal *= (1.0 + portionInc);
        factorProt *= (1.0 + portionInc);
    });

    console.log(`⚙️ Factores Aplicados: Kcal x${factorKcal.toFixed(2)}, Prot x${factorProt.toFixed(2)}`);

    // 5. Generate JSON Entries
    const macrosJson: any = {};
    const ingredientesJson: any = {};
    const recetasJson: any = {};

    plates.forEach(p => {
        const kcalFinal = Math.round((p.calorias || 0) * factorKcal);
        const protFinal = Number(((p.proteinas || 0) * factorProt).toFixed(1));

        const rawIngs = (p.ingredientes && Array.isArray(p.ingredientes) && p.ingredientes.length > 0 && p.ingredientes[0] !== "")
            ? p.ingredientes
            : (p.ingredientes || []);
        
        const parsedIngs = rawIngs.map((s: string) => parseIngredientString(s)).filter((i: any) => i !== null);

        macrosJson[p.id] = {
            id: p.id,
            nombre: p.nombre,
            calorias: kcalFinal,
            minutos: p.minutos || 0,
            proteinas: protFinal,
            carbohidratos: p.carbohidratos || 0,
            grasas: p.grasas || 0,
            receta_id: p.receta_id,
            ingredientes: parsedIngs
        };
        ingredientesJson[p.id] = parsedIngs;
        recetasJson[p.id] = p.receta_id;
    });


    console.log('\n--- INSERT SQL SIMULADO (Ejemplo para un día) ---');
    const insertSql = `
INSERT INTO "public"."progreso_cliente_nutricion" 
("cliente_id", "actividad_id", "fecha", "ejercicios_completados", "ejercicios_pendientes", "macros", "ingredientes", "recetas", "enrollment_id") 
VALUES (
    '${clientId}', 
    ${activityId}, 
    '2026-03-30', 
    '{"ejercicios": []}', 
    '{"ejercicios": [753, 758, 759, 760, 761, 764, 765]}', 
    '${JSON.stringify(macrosJson)}', 
    '${JSON.stringify(ingredientesJson)}', 
    '${JSON.stringify(recetasJson)}',
    215
);`;
    console.log(insertSql);
}

simulateGeneration();
