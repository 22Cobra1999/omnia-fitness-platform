import fetch from 'node-fetch';

/**
 * Script de diagnóstico para Bunny.net Stream
 * Uso: npx ts-node scripts/check_bunny_status.ts [videoId]
 */

const LIBRARY_ID = '510910';
const API_KEY = 'd082be64-3f24-47b2-aa1157da7fa7-326e-4b9b';

async function checkStatus() {
  const videoId = process.argv[2];

  if (videoId) {
    console.log(`🔍 Consultando estado del video: ${videoId}...`);
    try {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            AccessKey: API_KEY
          }
        }
      );

      if (!response.ok) {
        console.error(`❌ Error Bunny API: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json() as any;
      console.log('\n--- Información de Bunny.net ---');
      console.log(`ID: ${data.guid}`);
      console.log(`Título: ${data.title}`);
      console.log(`Estado: ${getStatusLabel(data.status)} (${data.status})`);
      console.log(`Progreso: ${data.encodeProgress}%`);
      console.log(`Duración: ${data.length}s`);
      console.log(`Vistas: ${data.views}`);
      console.log(`Thumbnail: ${data.thumbnailFileName}`);
      console.log('-------------------------------\n');

      if (data.status === 4) {
        console.log('✅ El video está listo para ser reproducido.');
      } else if (data.status === 3) {
        console.log('⏳ El video se está procesando (transcoding).');
      } else {
        console.log('⚠️ El video no está listo o hubo un error.');
      }

    } catch (err) {
      console.error('❌ Error de conexión:', err);
    }
  } else {
    console.log('📋 Listando los últimos 5 videos subidos...');
    try {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos?page=1&itemsPerPage=5&orderBy=date`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            AccessKey: API_KEY
          }
        }
      );

      if (!response.ok) {
        console.error(`❌ Error Bunny API: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json() as any;
      console.log('\n--- Últimos 5 videos ---');
      data.items.forEach((v: any) => {
        console.log(`[${getStatusLabel(v.status)}] ${v.guid} - ${v.title} (${v.length}s)`);
      });
      console.log('------------------------\n');
      console.log('Uso: npx ts-node scripts/check_bunny_status.ts [videoId]');
    } catch (err) {
      console.error('❌ Error de conexión:', err);
    }
  }
}

function getStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'Resolución';
    case 1: return 'Fallo';
    case 2: return 'Subiendo';
    case 3: return 'Procesando';
    case 4: return 'Listo';
    case 5: return 'Codificando';
    case 6: return 'Subida Local';
    default: return 'Desconocido';
  }
}

checkStatus();
