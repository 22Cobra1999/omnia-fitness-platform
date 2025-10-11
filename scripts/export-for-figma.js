#!/usr/bin/env node

/**
 * 🎨 Script de exportación automática para Figma
 * Captura screenshots de todas las pantallas de OMNIA
 * Resolucion: 390x844 (iPhone 14)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../figma-export');
const SCREENS_DIR = path.join(OUTPUT_DIR, 'screens');
const MODALS_DIR = path.join(OUTPUT_DIR, 'modals');
const COMPONENTS_DIR = path.join(OUTPUT_DIR, 'components');

// Configuración
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  viewport: {
    width: 390,
    height: 844
  },
  // Credenciales de prueba
  clientEmail: 'pomatifranco@gmail.com',
  clientPassword: 'tu_password_aqui', // Cambiar
  coachEmail: 'f.pomati@usal.edu.ar',
  coachPassword: 'tu_password_aqui', // Cambiar
};

// Crear directorios
function createDirectories() {
  [OUTPUT_DIR, SCREENS_DIR, MODALS_DIR, COMPONENTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  console.log('✅ Directorios creados');
}

// Esperar y hacer screenshot
async function captureScreen(page, name, folder = SCREENS_DIR) {
  await page.waitForTimeout(2000); // Esperar carga
  const filepath = path.join(folder, `${name}.png`);
  await page.screenshot({
    path: filepath,
    fullPage: false
  });
  console.log(`  ✅ Capturado: ${name}.png`);
}

// Login
async function login(page, email, password) {
  console.log(`🔐 Iniciando sesión: ${email}`);
  
  // Esperar que cargue la página
  await page.waitForTimeout(2000);
  
  // Click en botón de login (ajustar selector según tu app)
  try {
    await page.click('button:has-text("Iniciar sesión")', { timeout: 3000 });
  } catch (e) {
    console.log('  ℹ️  No hay botón de login visible, quizás ya está logueado');
  }
  
  await page.waitForTimeout(1000);
  
  // Ingresar credenciales
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  
  // Click en submit
  await page.click('button[type="submit"]');
  
  // Esperar navegación
  await page.waitForTimeout(3000);
  console.log('  ✅ Sesión iniciada');
}

// Navegar a tab
async function navigateToTab(page, tab) {
  const tabSelectors = {
    'search': 'button:has-text("Search")',
    'activity': 'button:has-text("Activity")',
    'community': 'button:has-text("Community")',
    'calendar': 'button:has-text("Calendar")',
    'profile': 'button:has-text("Profile")',
    'clients': 'button:has-text("Clients")',
    'products': 'button:has-text("Products")',
  };
  
  const selector = tabSelectors[tab];
  if (selector) {
    await page.click(selector);
    await page.waitForTimeout(2000);
  }
}

// Capturar pantallas del cliente
async function captureClientScreens(browser) {
  console.log('\n👤 CAPTURANDO PANTALLAS DEL CLIENTE...\n');
  
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  await page.goto(CONFIG.baseUrl);
  
  // Login como cliente
  await login(page, CONFIG.clientEmail, CONFIG.clientPassword);
  
  // Capturar cada tab
  console.log('📸 Capturando tabs del cliente:');
  
  await navigateToTab(page, 'search');
  await captureScreen(page, 'client-search');
  
  await navigateToTab(page, 'activity');
  await captureScreen(page, 'client-activity');
  
  await navigateToTab(page, 'community');
  await captureScreen(page, 'client-community');
  
  await navigateToTab(page, 'calendar');
  await captureScreen(page, 'client-calendar');
  
  await navigateToTab(page, 'profile');
  await captureScreen(page, 'client-profile');
  
  console.log('✅ Pantallas del cliente completadas\n');
  
  await page.close();
}

// Capturar pantallas del coach
async function captureCoachScreens(browser) {
  console.log('\n👨‍💼 CAPTURANDO PANTALLAS DEL COACH...\n');
  
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  await page.goto(CONFIG.baseUrl);
  
  // Login como coach
  await login(page, CONFIG.coachEmail, CONFIG.coachPassword);
  
  // Capturar cada tab
  console.log('📸 Capturando tabs del coach:');
  
  await navigateToTab(page, 'clients');
  await captureScreen(page, 'coach-clients');
  
  await navigateToTab(page, 'products');
  await captureScreen(page, 'coach-products');
  
  await navigateToTab(page, 'community');
  await captureScreen(page, 'coach-community');
  
  await navigateToTab(page, 'calendar');
  await captureScreen(page, 'coach-calendar');
  
  await navigateToTab(page, 'profile');
  await captureScreen(page, 'coach-profile');
  
  console.log('✅ Pantallas del coach completadas\n');
  
  await page.close();
}

// Capturar componentes individuales
async function captureComponents(browser) {
  console.log('\n🧩 CAPTURANDO COMPONENTES...\n');
  
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  await page.goto(CONFIG.baseUrl);
  
  // Capturar header (parte superior)
  await page.screenshot({
    path: path.join(COMPONENTS_DIR, 'header.png'),
    clip: { x: 0, y: 0, width: 390, height: 80 }
  });
  console.log('  ✅ Capturado: header.png');
  
  // Capturar bottom navigation (parte inferior)
  await page.screenshot({
    path: path.join(COMPONENTS_DIR, 'bottom-nav.png'),
    clip: { x: 0, y: 774, width: 390, height: 70 }
  });
  console.log('  ✅ Capturado: bottom-nav.png');
  
  console.log('✅ Componentes completados\n');
  
  await page.close();
}

// Main
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 EXPORT FOR FIGMA - OMNIA APP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Crear directorios
  createDirectories();
  
  console.log('🚀 Iniciando navegador headless...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Cambia a true para modo invisible
    defaultViewport: CONFIG.viewport
  });
  
  try {
    // Capturar pantallas del cliente
    await captureClientScreens(browser);
    
    // Capturar pantallas del coach
    await captureCoachScreens(browser);
    
    // Capturar componentes
    await captureComponents(browser);
    
    // Generar JSON con estructura
    const structure = {
      client: {
        tabs: ['search', 'activity', 'community', 'calendar', 'profile'],
        screens: [
          'client-search.png',
          'client-activity.png',
          'client-community.png',
          'client-calendar.png',
          'client-profile.png'
        ]
      },
      coach: {
        tabs: ['clients', 'products', 'community', 'calendar', 'profile'],
        screens: [
          'coach-clients.png',
          'coach-products.png',
          'coach-community.png',
          'coach-calendar.png',
          'coach-profile.png'
        ]
      },
      components: [
        'header.png',
        'bottom-nav.png'
      ],
      viewport: CONFIG.viewport,
      colors: {
        black: '#000000',
        blackSecondary: '#1E1E1E',
        orange: '#FF7939',
        white: '#FFFFFF',
        gray: '#9CA3AF'
      }
    };
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'structure.json'),
      JSON.stringify(structure, null, 2)
    );
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ EXPORTACIÓN COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📂 Archivos generados en: figma-export/\n');
    console.log('📊 Resumen:');
    console.log('  • Pantallas cliente: 5');
    console.log('  • Pantallas coach: 5');
    console.log('  • Componentes: 2');
    console.log('  • Total: 12 imágenes\n');
    console.log('📝 Próximo paso:');
    console.log('  1. Abre Figma');
    console.log('  2. Arrastra las imágenes de figma-export/screens/');
    console.log('  3. Usa como referencia para diseñar');
    console.log('  4. Consulta structure.json para organización\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar
main().catch(console.error);

