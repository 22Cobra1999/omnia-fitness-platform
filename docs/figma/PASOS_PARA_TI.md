# 🎯 PASOS EXACTOS PARA TI - EXPORTAR A FIGMA

## ⚡ SIGUE ESTOS PASOS EN ORDEN

---

## 📝 **PASO 1: EDITAR CREDENCIALES (2 minutos)**

Abre el archivo: `scripts/export-for-figma.js`

Busca la línea 20 y cambia:

```javascript
clientPassword: 'TU_PASSWORD_CLIENTE_AQUI', // ⬅️ PON TU PASSWORD
```

Busca la línea 22 y cambia:

```javascript
coachPassword: 'TU_PASSWORD_COACH_AQUI', // ⬅️ PON TU PASSWORD
```

**Las cuentas que usa el script:**
- Cliente: `pomatifranco@gmail.com`
- Coach: `f.pomati@usal.edu.ar`

Guarda el archivo.

---

## 🚀 **PASO 2: EJECUTAR EL SCRIPT (3 minutos)**

Abre la terminal y ejecuta:

```bash
npm run export-for-figma
```

**Lo que verás:**
```
🎨 EXPORT FOR FIGMA - OMNIA APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Directorios creados
🚀 Iniciando navegador headless...

👤 CAPTURANDO PANTALLAS DEL CLIENTE...
🔐 Iniciando sesión: pomatifranco@gmail.com
  ✅ Sesión iniciada
📸 Capturando tabs del cliente:
  ✅ Capturado: client-search.png
  ✅ Capturado: client-activity.png
  ✅ Capturado: client-community.png
  ✅ Capturado: client-calendar.png
  ✅ Capturado: client-profile.png
✅ Pantallas del cliente completadas

👨‍💼 CAPTURANDO PANTALLAS DEL COACH...
🔐 Iniciando sesión: f.pomati@usal.edu.ar
  ✅ Sesión iniciada
📸 Capturando tabs del coach:
  ✅ Capturado: coach-clients.png
  ✅ Capturado: coach-products.png
  ✅ Capturado: coach-community.png
  ✅ Capturado: coach-calendar.png
  ✅ Capturado: coach-profile.png
✅ Pantallas del coach completadas

🧩 CAPTURANDO COMPONENTES...
  ✅ Capturado: header.png
  ✅ Capturado: bottom-nav.png
✅ Componentes completados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ EXPORTACIÓN COMPLETADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Archivos generados en: figma-export/

📊 Resumen:
  • Pantallas cliente: 5
  • Pantallas coach: 5
  • Componentes: 2
  • Total: 12 imágenes

📝 Próximo paso:
  1. Abre Figma
  2. Arrastra las imágenes de figma-export/screens/
  3. Usa como referencia para diseñar
  4. Consulta structure.json para organización
```

---

## 📂 **PASO 3: VERIFICAR LOS ARCHIVOS (1 minuto)**

Abre la carpeta:

```bash
open figma-export/
```

Deberías ver:

```
figma-export/
├── screens/
│   ├── client-search.png        (390 x 844 px)
│   ├── client-activity.png      (390 x 844 px)
│   ├── client-community.png     (390 x 844 px)
│   ├── client-calendar.png      (390 x 844 px)
│   ├── client-profile.png       (390 x 844 px)
│   ├── coach-clients.png        (390 x 844 px)
│   ├── coach-products.png       (390 x 844 px)
│   ├── coach-community.png      (390 x 844 px)
│   ├── coach-calendar.png       (390 x 844 px)
│   └── coach-profile.png        (390 x 844 px)
├── components/
│   ├── header.png               (390 x 80 px)
│   └── bottom-nav.png           (390 x 70 px)
└── structure.json               (metadata)
```

---

## 🎨 **PASO 4: IMPORTAR A FIGMA (10 minutos)**

### **4.1 Abrir Figma:**
```
1. Ve a https://figma.com
2. Click "New design file"
3. Nombrar: "OMNIA App - Diseño Completo"
```

### **4.2 Crear Páginas:**
```
En el panel izquierdo, crea 3 páginas:

📄 Página 1: "🎨 Guía de Estilos"
📄 Página 2: "👤 Cliente"
📄 Página 3: "👨‍💼 Coach"
📄 Página 4: "🧩 Componentes"
```

### **4.3 Importar Screenshots:**

**En página "👤 Cliente":**
```
1. Arrastra los 5 archivos client-*.png
2. Ordénalos horizontalmente
3. Nombra cada frame:
   - Frame 1: "Search"
   - Frame 2: "Activity"
   - Frame 3: "Community"
   - Frame 4: "Calendar"
   - Frame 5: "Profile"
```

**En página "👨‍💼 Coach":**
```
1. Arrastra los 5 archivos coach-*.png
2. Ordénalos horizontalmente
3. Nombra cada frame:
   - Frame 1: "Clients"
   - Frame 2: "Products"
   - Frame 3: "Community"
   - Frame 4: "Calendar"
   - Frame 5: "Profile"
```

**En página "🧩 Componentes":**
```
1. Arrastra header.png y bottom-nav.png
2. Nombra:
   - "Header/Universal"
   - "BottomNav"
```

---

## 🎨 **PASO 5: DISEÑAR ENCIMA (3-4 horas)**

### **5.1 Configurar Estilos (30 min):**

En página "🎨 Guía de Estilos":

**Crear Color Styles:**
```
1. Crea rectángulos con cada color
2. Click derecho → Create color style
3. Nombrar:
   - "Black/Primary" → #000000
   - "Black/Secondary" → #1E1E1E
   - "Orange/Primary" → #FF7939
   - "White" → #FFFFFF
   - "Gray/400" → #9CA3AF
   - "Gray/600" → #4B5563
```

**Crear Text Styles:**
```
1. Crea texto de ejemplo
2. Click derecho → Create text style
3. Nombrar:
   - "H1/Bold" → Inter Bold 28px
   - "H2/SemiBold" → Inter SemiBold 24px
   - "Body/Regular" → Inter Regular 16px
   - "Body Small" → Inter Regular 14px
   - "Caption" → Inter Medium 12px
```

### **5.2 Crear Componentes Base (1 hora):**

**Componente: Header**
```
1. Crea frame 390x80
2. Fondo negro
3. Agrega icons Settings (izq) y Messages (der)
4. Logo OMNIA centro
5. Convierte a componente: Cmd+Alt+K
6. Nombra: "Header/Universal"
```

**Componente: Bottom Nav Cliente**
```
1. Crea frame 390x70
2. Fondo negro
3. 5 tabs con icons y labels
4. Tab central elevado con círculo naranja
5. Convierte a componente
6. Crea variantes para cada tab activo
7. Nombra: "BottomNav/Client"
```

**Repite para otros componentes:**
- Button/Primary
- Button/Secondary
- Card/Product
- Input/Text
- Toggle/Switch

### **5.3 Diseñar Pantallas (1.5 horas):**

**Para cada pantalla:**
```
1. Bloquea el screenshot de referencia (Cmd+Shift+L)
2. Reduce opacidad al 50%
3. Crea nuevo frame encima (390x844)
4. Usa componentes creados
5. Sigue las medidas del screenshot
6. Mantén colores y estilos consistentes
7. Al terminar, elimina screenshot de referencia
```

### **5.4 Conectar Prototype (1 hora):**

**Usa la tabla de `TABLA_NAVEGACION_COMPLETA.md`:**
```
1. Modo Prototype (arriba derecha)
2. Cada botón/card → arrastra flecha a pantalla destino
3. Configura:
   - Animation: Smart Animate
   - Duration: 300ms
   - Easing: Ease Out
4. Para modales:
   - Open as: Overlay
   - Position: Center
   - Background: Black 60%
   - Close on click outside: Yes
```

---

## ✅ **RESULTADO FINAL**

Después de seguir estos pasos tendrás:

✅ **10 pantallas** diseñadas en Figma
✅ **10 componentes** reutilizables
✅ **Prototipo interactivo** completo
✅ **Sistema de diseño** consistente
✅ **Listo para presentar** o desarrollar

**Tiempo total: 4-5 horas** (vs 10 horas desde cero)

---

## 🎯 **COMANDO RÁPIDO PARA COPIAR**

```bash
# 1. Edita credenciales en scripts/export-for-figma.js
# 2. Ejecuta:
npm run export-for-figma

# 3. Abre la carpeta:
open figma-export/

# 4. Arrastra todo a Figma y diseña encima
```

---

## 📞 **SI TIENES PROBLEMAS**

**El script no funciona:**
```bash
# Verifica que el servidor esté corriendo
curl http://localhost:3000

# Si no está:
npm run dev
# Espera 10 segundos y vuelve a intentar
```

**Screenshots salen mal:**
```javascript
// En export-for-figma.js, cambia:
headless: false  // Para ver el navegador
// Y aumenta los timeouts:
await page.waitForTimeout(5000); // Más tiempo
```

**No puedo hacer login:**
```javascript
// Verifica las credenciales en export-for-figma.js
// Líneas 20 y 22
```

---

**¡Listo para exportar!** 🚀

**Tu flujo completo:**
1. Edita passwords (2 min)
2. Ejecuta script (3 min)
3. Importa a Figma (10 min)
4. Diseña encima (3-4 horas)
5. **¡Diseño completo!** 🎉
