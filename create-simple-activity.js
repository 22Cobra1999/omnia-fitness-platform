// Script para crear una actividad simple con stock usando SQL directo
const fetch = require('node-fetch');

async function createSimpleActivity() {
  try {
    console.log('🚀 Creando actividad simple con stock...');
    
    // Usar la API de SQL directo para crear una actividad
    const response = await fetch('http://localhost:3000/api/activities/sql-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 999, // ID temporal
        title: "Programa de Fuerza y Resistencia — 8 semanas",
        description: "Programa completo de entrenamiento de fuerza y resistencia con 25 cupos disponibles",
        type: "fitness_program",
        coach_id: "550e8400-e29b-41d4-a716-446655440000"
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Actividad creada exitosamente:');
      console.log(`  - ID: ${result.activityId}`);
      console.log(`  - Título: Programa de Fuerza y Resistencia — 8 semanas`);
      console.log(`  - Descripción: Incluye 25 cupos disponibles`);
    } else {
      console.error('❌ Error creando actividad:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error en el script:', error);
  }
}

// Ejecutar el script
createSimpleActivity();
