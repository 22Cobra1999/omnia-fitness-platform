const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser for .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

async function checkRonaldProgress() {
  loadEnv();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
  const fecha = '2026-03-30';
  
  console.log(`🔍 Checking progress for client ${clientId} on ${fecha}...`);
  
  const { data, error } = await supabase
    .from('progreso_cliente')
    .select('*')
    .eq('cliente_id', clientId)
    .eq('fecha', fecha);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Found ${data.length} records.`);
  data.forEach((r, i) => {
    console.log(`\n--- Record ${i + 1} (ID: ${r.id}) ---`);
    console.log(`Activity ID: ${r.actividad_id}`);
    console.log(`Enrollment ID: ${r.enrollment_id}`);
    console.log(`Pendientes:`, JSON.stringify(r.ejercicios_pendientes, null, 2));
    console.log(`Completados:`, JSON.stringify(r.ejercicios_completados, null, 2));
    console.log(`Detalles:`, r.detalles_series ? 'Yes' : 'No');
  });
}

checkRonaldProgress();
