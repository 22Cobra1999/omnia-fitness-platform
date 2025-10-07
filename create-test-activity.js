// Script para crear una actividad de prueba con stock
const fetch = require('node-fetch');

async function createTestActivity() {
  try {
    console.log('🚀 Creando actividad de prueba con stock...');
    
    const activityData = {
      title: "Programa de Fuerza y Resistencia — 8 semanas",
      description: "Programa completo de entrenamiento de fuerza y resistencia",
      price: 150,
      coach_id: "550e8400-e29b-41d4-a716-446655440000",
      type: "fitness_program",
      difficulty: "beginner",
      capacity: 25, // Stock/Cupos
      is_public: true,
      duration: 8,
      calories: 300,
      image_url: null,
      video_url: null,
      program_info: {
        program_duration: 8
      },
      availability: {
        available_days: ["Lunes", "Miércoles", "Viernes"],
        available_hours: "18:00-20:00",
        availability_type: "scheduled"
      },
      consultation_info: {
        videocall_duration: 30,
        general_preference: "flexible"
      },
      tags: ["fuerza", "resistencia", "8 semanas"]
    };
    
    const response = await fetch('http://localhost:3000/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Actividad creada exitosamente:');
      console.log(`  - ID: ${result.activityId}`);
      console.log(`  - Título: ${activityData.title}`);
      console.log(`  - Stock/Cupos: ${activityData.capacity}`);
      console.log(`  - Precio: $${activityData.price}`);
    } else {
      console.error('❌ Error creando actividad:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error en el script:', error);
  }
}

// Ejecutar el script
createTestActivity();
