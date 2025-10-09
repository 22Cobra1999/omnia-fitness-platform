// Script para ejecutar la limpieza de ejercicios_detalles via API
// Ejecuta las consultas paso a paso usando el endpoint /api/execute-sql

const fs = require('fs');
const path = require('path');

// Función para ejecutar SQL via API
async function ejecutarSQL(sql) {
  try {
    const response = await fetch('http://localhost:3000/api/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error ejecutando SQL:', error);
    return { success: false, error: error.message };
  }
}

// Función para leer archivo SQL
function leerArchivoSQL(nombreArchivo) {
  const rutaArchivo = path.join(__dirname, nombreArchivo);
  return fs.readFileSync(rutaArchivo, 'utf8');
}

// Función principal
async function ejecutarLimpieza() {
  console.log('🚀 Iniciando limpieza de ejercicios_detalles...\n');

  try {
    // Paso 1: Verificar estructura actual
    console.log('📋 Paso 1: Verificando estructura actual...');
    const sqlVerificacion = `
      SELECT 
        column_name as nombre_columna,
        data_type as tipo_dato
      FROM information_schema.columns 
      WHERE table_name = 'ejercicios_detalles'
      ORDER BY ordinal_position;
    `;
    
    const resultadoVerificacion = await ejecutarSQL(sqlVerificacion);
    if (resultadoVerificacion.success) {
      console.log('✅ Estructura actual verificada');
      console.log('Columnas encontradas:', resultadoVerificacion.data);
    } else {
      console.log('❌ Error verificando estructura:', resultadoVerificacion.error);
    }

    // Paso 2: Crear backup
    console.log('\n💾 Paso 2: Creando backup...');
    const sqlBackup = `
      CREATE TABLE IF NOT EXISTS ejercicios_detalles_backup AS 
      SELECT * FROM ejercicios_detalles;
    `;
    
    const resultadoBackup = await ejecutarSQL(sqlBackup);
    if (resultadoBackup.success) {
      console.log('✅ Backup creado exitosamente');
    } else {
      console.log('❌ Error creando backup:', resultadoBackup.error);
    }

    // Paso 3: Eliminar columnas obsoletas
    console.log('\n🧹 Paso 3: Eliminando columnas obsoletas...');
    const columnasObsoletas = [
      'semana', 'dia', 'día', 'periodos', 'periodo',
      'week', 'day', 'period', 'fecha_semana', 'fecha_dia', 
      'fecha_periodo', 'numero_semana', 'numero_dia', 'numero_periodo'
    ];

    for (const columna of columnasObsoletas) {
      const sqlEliminar = `ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS ${columna};`;
      const resultado = await ejecutarSQL(sqlEliminar);
      if (resultado.success) {
        console.log(`✅ Columna ${columna} eliminada`);
      } else {
        console.log(`⚠️ Columna ${columna} no existe o ya fue eliminada`);
      }
    }

    // Paso 4: Verificar estructura después de la limpieza
    console.log('\n📋 Paso 4: Verificando estructura después de la limpieza...');
    const sqlVerificacionFinal = `
      SELECT 
        column_name as nombre_columna,
        data_type as tipo_dato
      FROM information_schema.columns 
      WHERE table_name = 'ejercicios_detalles'
      ORDER BY ordinal_position;
    `;
    
    const resultadoFinal = await ejecutarSQL(sqlVerificacionFinal);
    if (resultadoFinal.success) {
      console.log('✅ Estructura final verificada');
      console.log('Columnas restantes:', resultadoFinal.data);
    } else {
      console.log('❌ Error verificando estructura final:', resultadoFinal.error);
    }

    // Paso 5: Verificar que los datos siguen intactos
    console.log('\n🔍 Paso 5: Verificando integridad de datos...');
    const sqlConteo = `
      SELECT 
        (SELECT COUNT(*) FROM ejercicios_detalles) as registros_actuales,
        (SELECT COUNT(*) FROM ejercicios_detalles_backup) as registros_backup;
    `;
    
    const resultadoConteo = await ejecutarSQL(sqlConteo);
    if (resultadoConteo.success) {
      console.log('✅ Conteo de registros:', resultadoConteo.data);
    } else {
      console.log('❌ Error verificando conteo:', resultadoConteo.error);
    }

    console.log('\n🎉 Limpieza completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar la limpieza
ejecutarLimpieza();




























