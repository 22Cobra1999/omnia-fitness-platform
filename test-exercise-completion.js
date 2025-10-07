/**
 * Script de prueba para verificar el flujo de completado de ejercicios
 * 
 * Este script simula el flujo completo:
 * 1. Cargar actividades del día
 * 2. Marcar un ejercicio como completado
 * 3. Verificar que se guardó correctamente
 * 4. Desmarcar el ejercicio
 * 5. Verificar que se desmarcó correctamente
 */

const BASE_URL = 'http://localhost:3000';

async function testExerciseCompletion() {
  console.log('🧪 INICIANDO PRUEBA DE COMPLETADO DE EJERCICIOS');
  console.log('='.repeat(60));

  try {
    // Paso 1: Simular carga de actividades del día
    console.log('\n📋 PASO 1: Cargando actividades del día...');
    const todayResponse = await fetch(`${BASE_URL}/api/activities/today?activityId=78&fecha=${new Date().toISOString().split('T')[0]}`);
    const todayData = await todayResponse.json();
    
    if (!todayData.success || !todayData.data.activities.length) {
      console.log('❌ No hay actividades para probar');
      return;
    }

    const firstActivity = todayData.data.activities[0];
    console.log(`✅ Actividad encontrada: ${firstActivity.name} (ID: ${firstActivity.id})`);
    console.log(`   Estado inicial: ${firstActivity.completed ? 'Completado' : 'Pendiente'}`);

    // Paso 2: Verificar estado actual en la base de datos
    console.log('\n🔍 PASO 2: Verificando estado actual en BD...');
    const currentStateResponse = await fetch(`${BASE_URL}/api/ejecuciones-ejercicio?id=${firstActivity.id}`);
    const currentStateData = await currentStateResponse.json();
    
    if (currentStateData.success && currentStateData.ejecuciones.length > 0) {
      const currentExecution = currentStateData.ejecuciones[0];
      console.log(`✅ Estado actual en BD: ${currentExecution.completado ? 'Completado' : 'Pendiente'}`);
    }

    // Paso 3: Marcar como completado
    console.log('\n🔥 PASO 3: Marcando ejercicio como completado...');
    const toggleToCompleted = await fetch(`${BASE_URL}/api/ejecuciones-ejercicio`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: firstActivity.id,
        completado: true
      })
    });

    const toggleResult = await toggleToCompleted.json();
    console.log(`📡 Respuesta del toggle:`, toggleResult);

    if (toggleResult.success) {
      console.log('✅ Ejercicio marcado como completado correctamente');
    } else {
      console.log('❌ Error marcando ejercicio como completado:', toggleResult.error);
      return;
    }

    // Paso 4: Verificar que se guardó
    console.log('\n🔍 PASO 4: Verificando que se guardó el estado...');
    const verifyCompletedResponse = await fetch(`${BASE_URL}/api/ejecuciones-ejercicio?id=${firstActivity.id}`);
    const verifyCompletedData = await verifyCompletedResponse.json();
    
    if (verifyCompletedData.success && verifyCompletedData.ejecuciones.length > 0) {
      const updatedExecution = verifyCompletedData.ejecuciones[0];
      console.log(`✅ Estado verificado en BD: ${updatedExecution.completado ? 'Completado' : 'Pendiente'}`);
      
      if (updatedExecution.completado) {
        console.log('✅ ¡ÉXITO! El ejercicio se guardó como completado correctamente');
      } else {
        console.log('❌ ERROR: El ejercicio no se guardó como completado');
        return;
      }
    }

    // Paso 5: Desmarcar ejercicio
    console.log('\n🔥 PASO 5: Desmarcando ejercicio...');
    const toggleToPending = await fetch(`${BASE_URL}/api/ejecuciones-ejercicio`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: firstActivity.id,
        completado: false
      })
    });

    const toggleResult2 = await toggleToPending.json();
    console.log(`📡 Respuesta del toggle:`, toggleResult2);

    if (toggleResult2.success) {
      console.log('✅ Ejercicio desmarcado correctamente');
    } else {
      console.log('❌ Error desmarcando ejercicio:', toggleResult2.error);
      return;
    }

    // Paso 6: Verificar que se desmarcó
    console.log('\n🔍 PASO 6: Verificando que se desmarcó...');
    const verifyPendingResponse = await fetch(`${BASE_URL}/api/ejecuciones-ejercicio?id=${firstActivity.id}`);
    const verifyPendingData = await verifyPendingResponse.json();
    
    if (verifyPendingData.success && verifyPendingData.ejecuciones.length > 0) {
      const finalExecution = verifyPendingData.ejecuciones[0];
      console.log(`✅ Estado final en BD: ${finalExecution.completado ? 'Completado' : 'Pendiente'}`);
      
      if (!finalExecution.completado) {
        console.log('✅ ¡ÉXITO! El ejercicio se desmarcó correctamente');
      } else {
        console.log('❌ ERROR: El ejercicio no se desmarcó');
        return;
      }
    }

    console.log('\n🎉 ¡PRUEBA COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testExerciseCompletion();
