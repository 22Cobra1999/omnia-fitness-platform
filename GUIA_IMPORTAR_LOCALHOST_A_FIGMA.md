# 🔄 GUÍA: IMPORTAR LOCALHOST A FIGMA (Semi-Automático)

## 🎯 **MÉTODOS DISPONIBLES**

---

## ✅ **MÉTODO 1: HTML to Figma Plugin (RECOMENDADO)**

### **Ventajas:**
- ✅ Semi-automático (90% del trabajo)
- ✅ Importa estilos CSS directamente
- ✅ Mantiene estructura de componentes
- ✅ Colores y tipografía exactos

### **Plugin a usar:**
**"html.to.design"** - Plugin oficial de Figma

### **Pasos:**

#### **1. Instalar el Plugin:**
```
1. Abre Figma
2. Menu → Plugins → Browse plugins
3. Busca: "html.to.design"
4. Click "Install"
```

#### **2. Capturar el HTML de tu localhost:**

**Opción A - Copiar desde DevTools:**
```
1. Abre http://localhost:3001 en Chrome
2. Abre DevTools (F12)
3. Click derecho en <body> en Elements
4. Copy → Copy outerHTML
5. Pega en un archivo temporal
```

**Opción B - Usar el script que voy a crear:**
```bash
# Script automático que genera HTML exportable
npm run export-for-figma
```

#### **3. Importar a Figma:**
```
1. En Figma: Plugins → html.to.design
2. Pega tu HTML
3. Click "Import"
4. ¡Voilà! Tu diseño en Figma
```

### **Limitaciones:**
- ⚠️ No importa JavaScript (solo visual estático)
- ⚠️ Necesitas ajustar interactividad manualmente
- ⚠️ Algunos estilos pueden necesitar ajustes

---

## ✅ **MÉTODO 2: Figma DevMode + Screenshots (Híbrido)**

### **Ventajas:**
- ✅ Muy preciso visualmente
- ✅ Rápido para prototipar
- ✅ Mantiene proporciones exactas

### **Pasos:**

#### **1. Capturar screenshots de cada pantalla:**
```bash
# Voy a crear un script automatizado que captura
# todas las pantallas usando Playwright
```

#### **2. Importar a Figma:**
```
1. Arrastra screenshots a Figma
2. Usa como referencia de fondo
3. Rediseña encima usando componentes
```

### **Limitaciones:**
- ⚠️ Requiere rediseño manual
- ⚠️ Más lento que HTML import
- ✅ Pero más control del resultado

---

## ✅ **MÉTODO 3: Anima + Figma (Automático - Requiere plugin pago)**

### **Plugin: Anima**
- Convierte React components → Figma
- Importa desde URL
- Mantiene componentes

### **Precio:** ~$31/mes

### **Pasos:**
```
1. Instala plugin Anima en Figma
2. Pega URL: http://localhost:3001
3. Selecciona elementos a importar
4. Click "Import to Figma"
```

---

## 🚀 **MÉTODO RECOMENDADO: Script Automatizado**

Voy a crear un **script que haga screenshots automáticos** de todas las pantallas y las prepare para Figma.

### **Ventajas de mi script:**
- ✅ 100% automático
- ✅ Captura todas las pantallas
- ✅ Resolución exacta (390x844)
- ✅ Gratis
- ✅ Screenshots pixel-perfect

---

## 🎬 **SCRIPT AUTOMÁTICO QUE VOY A CREAR**

El script hará:
1. Abre cada tab automáticamente
2. Hace screenshot de cada pantalla
3. Captura modales
4. Genera archivo Figma-ready
5. Exporta JSON con estructura

### **Uso:**
```bash
npm run capture-screens-for-figma
```

### **Output:**
```
📁 figma-export/
  ├── screens/
  │   ├── client-search.png (390x844)
  │   ├── client-activity.png
  │   ├── client-calendar.png
  │   ├── coach-clients.png
  │   ├── coach-products.png
  │   └── ... (20 pantallas)
  ├── modals/
  │   ├── modal-product-detail.png
  │   ├── modal-create-product-step1.png
  │   └── ... (8 modales)
  ├── components/
  │   ├── header.png
  │   ├── bottom-nav-client.png
  │   ├── card-product.png
  │   └── ... (10 componentes)
  └── figma-structure.json
```

---

## 🎨 **ENTONCES... ¿QUÉ HAGO?**

### **OPCIÓN RÁPIDA (2 horas):**
```
1. Uso mi script automático (lo creo ahora)
2. Importo screenshots a Figma
3. Uso como referencia
4. Creo componentes encima
5. Conecto con Prototype
```

### **OPCIÓN COMPLETA (4 horas):**
```
1. Uso plugin html.to.design
2. Importo HTML directamente
3. Ajusto componentes
4. Limpio y organizo
5. Conecto Prototype
```

### **OPCIÓN PROFESIONAL (10 horas):**
```
1. Uso specs detalladas que creé
2. Diseño todo desde cero en Figma
3. Sistema de diseño completo
4. Componentes reutilizables perfectos
5. Prototipo interactivo completo
```

---

## ⚡ **MI RECOMENDACIÓN**

**Te recomiendo un ENFOQUE HÍBRIDO:**

1. **Primero:** Uso mi script para capturar screenshots (5 min)
2. **Luego:** Importo a Figma como referencia (5 min)
3. **Después:** Creo componentes reutilizables encima (2 horas)
4. **Finalmente:** Conecto con Prototype usando mi tabla (1 hora)

**Total: 3-4 horas** en lugar de 10 horas 🚀

---

## 🤔 **¿QUIERES QUE CREE EL SCRIPT AUTOMÁTICO?**

Puedo crear un script que:
- ✅ Navegue automáticamente por toda la app
- ✅ Capture screenshots de cada pantalla
- ✅ Las exporte con nombres organizados
- ✅ Genere JSON con la estructura
- ✅ Listo para importar a Figma

**¿Procedemos con el script automático?** 🤖✨

---

## 📝 **RESUMEN DE OPCIONES**

| Método | Tiempo | Costo | Calidad | Automatización |
|--------|--------|-------|---------|----------------|
| **Script Screenshots** | 3-4h | Gratis | ⭐⭐⭐⭐ | 80% |
| **html.to.design** | 4h | Gratis | ⭐⭐⭐⭐ | 90% |
| **Manual con specs** | 10h | Gratis | ⭐⭐⭐⭐⭐ | 0% |
| **Anima plugin** | 2h | $31/mes | ⭐⭐⭐⭐ | 95% |

**Mi recomendación:** Script Screenshots + Componentes manuales = Mejor balance ⚖️
