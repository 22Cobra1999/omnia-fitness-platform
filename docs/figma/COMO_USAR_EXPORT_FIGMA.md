# 🎨 CÓMO USAR EL EXPORT AUTOMÁTICO PARA FIGMA

## 🚀 GUÍA RÁPIDA DE USO

---

## ⚡ **PASOS RÁPIDOS (5 MINUTOS)**

### **1. Editar credenciales (IMPORTANTE):**

Abre el archivo: `scripts/export-for-figma.js`

Busca las líneas 18-21 y **cambia las contraseñas**:

```javascript
// Configuración
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  viewport: {
    width: 390,
    height: 844
  },
  // Credenciales de prueba
  clientEmail: 'pomatifranco@gmail.com',
  clientPassword: 'TU_PASSWORD_CLIENTE_AQUI', // ⬅️ CAMBIAR
  coachEmail: 'f.pomati@usal.edu.ar',
  coachPassword: 'TU_PASSWORD_COACH_AQUI', // ⬅️ CAMBIAR
};
```

### **2. Asegurarte que el servidor esté corriendo:**

```bash
# Verifica que localhost:3000 esté activo
curl http://localhost:3000

# Si no está corriendo:
npm run dev
```

### **3. Ejecutar el script:**

```bash
npm run export-for-figma
```

### **4. Ver el resultado:**

```bash
# Se crean automáticamente:
figma-export/
  ├── screens/
  │   ├── client-search.png        ✅
  │   ├── client-activity.png      ✅
  │   ├── client-community.png     ✅
  │   ├── client-calendar.png      ✅
  │   ├── client-profile.png       ✅
  │   ├── coach-clients.png        ✅
  │   ├── coach-products.png       ✅
  │   ├── coach-community.png      ✅
  │   ├── coach-calendar.png       ✅
  │   └── coach-profile.png        ✅
  ├── components/
  │   ├── header.png               ✅
  │   └── bottom-nav.png           ✅
  └── structure.json               ✅
```

### **5. Importar a Figma:**

```
1. Abre Figma
2. Crea nuevo proyecto: "OMNIA App"
3. Arrastra TODAS las imágenes de figma-export/screens/
4. Organiza en páginas:
   - Página "Cliente" → 5 pantallas
   - Página "Coach" → 5 pantallas
   - Página "Componentes" → header, nav
5. Usa como referencia para diseñar
```

---

## 🎯 **LO QUE HACE EL SCRIPT AUTOMÁTICAMENTE**

### **Proceso:**
1. 🌐 Abre navegador en localhost:3000
2. 🔐 Hace login como CLIENTE
3. 📸 Navega por todas las tabs del cliente
4. 💾 Captura screenshot de cada una (390x844)
5. 🚪 Cierra sesión
6. 🔐 Hace login como COACH
7. 📸 Navega por todas las tabs del coach
8. 💾 Captura screenshot de cada una
9. 🧩 Captura componentes (header, nav)
10. 📊 Genera JSON con estructura
11. ✅ Todo listo en carpeta `figma-export/`

**Duración total: ~2-3 minutos** ⚡

---

## 🎨 **CÓMO USAR LOS SCREENSHOTS EN FIGMA**

### **Método 1: Como Referencia (Más control)**
```
1. Importa screenshots a Figma
2. Bloquea las capas (lock)
3. Reduce opacidad al 50%
4. Diseña encima con componentes Figma
5. Al terminar, elimina los screenshots
```

### **Método 2: Como Base (Más rápido)**
```
1. Importa screenshots
2. Usa plugin "Remove BG" si necesitas
3. Agrupa elementos relacionados
4. Convierte a componentes
5. Ajusta colores y estilos
```

---

## 🔧 **TROUBLESHOOTING**

### **Error: "Cannot find module 'puppeteer'"**
```bash
# Instalar puppeteer
npm install --save-dev puppeteer
```

### **Error: "ECONNREFUSED localhost:3000"**
```bash
# Asegurarte que el servidor esté corriendo
npm run dev

# Esperar 10 segundos y volver a intentar
npm run export-for-figma
```

### **Error: "Login failed"**
```bash
# Verificar credenciales en scripts/export-for-figma.js
# Cambiar clientPassword y coachPassword
```

### **Screenshots salen en blanco:**
```javascript
// En scripts/export-for-figma.js, cambiar:
headless: false  // a false para ver qué pasa
// Aumentar timeouts si es lento:
await page.waitForTimeout(5000); // de 2000 a 5000
```

---

## 📊 **ESTRUCTURA DEL OUTPUT**

### **structure.json:**
```json
{
  "client": {
    "tabs": ["search", "activity", "community", "calendar", "profile"],
    "screens": [
      "client-search.png",
      "client-activity.png",
      "client-community.png",
      "client-calendar.png",
      "client-profile.png"
    ]
  },
  "coach": {
    "tabs": ["clients", "products", "community", "calendar", "profile"],
    "screens": [
      "coach-clients.png",
      "coach-products.png",
      "coach-community.png",
      "coach-calendar.png",
      "coach-profile.png"
    ]
  },
  "components": [
    "header.png",
    "bottom-nav.png"
  ],
  "viewport": { "width": 390, "height": 844 },
  "colors": {
    "black": "#000000",
    "blackSecondary": "#1E1E1E",
    "orange": "#FF7939",
    "white": "#FFFFFF",
    "gray": "#9CA3AF"
  }
}
```

Usa este JSON para organizar tu proyecto en Figma.

---

## ✅ **CHECKLIST DE USO**

- [ ] Servidor corriendo en localhost:3000
- [ ] Credenciales actualizadas en export-for-figma.js
- [ ] Puppeteer instalado (`npm install --save-dev puppeteer`)
- [ ] Ejecutar: `npm run export-for-figma`
- [ ] Verificar carpeta `figma-export/` creada
- [ ] Abrir Figma
- [ ] Importar screenshots
- [ ] Diseñar usando specs de `SPECS_FIGMA_DETALLADAS.md`
- [ ] Conectar con Prototype usando `TABLA_NAVEGACION_COMPLETA.md`

---

## 🎯 **PRÓXIMOS PASOS DESPUÉS DE EJECUTAR**

### **En Figma (3-4 horas):**

1. **Importar (10 min):**
   - Arrastra todos los PNG a Figma
   - Organiza en páginas (Cliente/Coach/Componentes)

2. **Crear Componentes Base (1 hora):**
   - Header
   - Bottom Navigation (2 versiones)
   - Card Producto
   - Buttons
   - Inputs
   - Usa screenshots como referencia

3. **Diseñar Pantallas (1.5 horas):**
   - Usa componentes creados
   - Sigue las specs de `SPECS_FIGMA_DETALLADAS.md`
   - Mantén consistencia

4. **Prototype (1 hora):**
   - Conecta navegación
   - Usa tabla de `TABLA_NAVEGACION_COMPLETA.md`
   - Agrega animaciones Smart Animate

5. **Testing (30 min):**
   - Prueba el prototipo
   - Verifica todos los flujos
   - Ajustes finales

**Total: 3-4 horas → Diseño completo en Figma** 🎉

---

## 💡 **TIPS PRO**

### **Para mejor resultado:**
1. ✅ Ejecuta el script con el navegador visible (`headless: false`)
2. ✅ Verifica que cada screenshot se vea bien
3. ✅ Si algo falla, aumenta los `waitForTimeout`
4. ✅ Captura en modo oscuro (ya está por defecto)

### **En Figma:**
1. ✅ Usa los screenshots como capa de fondo bloqueada
2. ✅ Reduce opacidad al 50% para trazar encima
3. ✅ Crea componentes desde el principio
4. ✅ Usa Auto Layout para todo
5. ✅ Al terminar, elimina los screenshots de referencia

---

## 🚀 **RESULTADO ESPERADO**

**Después de ejecutar el script:**
- ✅ 10 pantallas capturadas (cliente + coach)
- ✅ 2 componentes capturados (header + nav)
- ✅ 1 JSON con estructura
- ✅ Todo en resolución exacta (390x844)
- ✅ Listo para importar a Figma

**Después de diseñar en Figma (3-4h):**
- ✅ Diseño completo de OMNIA
- ✅ Componentes reutilizables
- ✅ Prototipo interactivo
- ✅ Sistema de diseño completo
- ✅ Listo para presentar/desarrollar

---

**¡Mucho más rápido que hacerlo todo manual!** ⚡✨
