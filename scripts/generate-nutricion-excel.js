const XLSX = require('xlsx');

// Crear workbook
const workbook = XLSX.utils.book_new();

// Headers de la plantilla
// Nota: La columna "Tipo" ya no es necesaria en el CSV. El tipo de plato se define luego en la planificación (Paso 5).
// Si el coach incluye una columna adicional como "Tipo", será ignorada por el parser.
const plantillaHeaders = [
  'Nombre',
  'Descripción',
  'Calorías',
  'Proteínas (g)',
  'Carbohidratos (g)',
  'Grasas (g)',
  'Ingredientes',
  'Porciones',
  'Minutos',
  'video_url'
];

// Datos de ejemplo para programa de nutrición
const plantillaRows = [
  {
    'Nombre': 'Avena con proteína y frutos rojos',
    'Descripción': '1. Cocina 50g de avena con agua o leche desnatada. 2. Agrega 1 scoop de proteína en polvo. 3. Decora con frutos rojos frescos y un puñado de almendras.',
    'Calorías': 380,
    'Proteínas (g)': 28,
    'Carbohidratos (g)': 45,
    'Grasas (g)': 12,
    'Ingredientes': 'Avena 50g; Proteína en polvo 1 scoop; Frutos rojos 100g; Almendras 20g',
    'Porciones': 1,
    'Minutos': 15,
    'video_url': ''
  },
  {
    'Nombre': 'Pollo a la plancha con quinoa',
    'Descripción': '1. Sazona 200g de pechuga de pollo con sal, pimienta y especias. 2. Cocina en sartén antiadherente sin aceite. 3. Sirve con 100g de quinoa cocida y ensalada verde con limón.',
    'Calorías': 520,
    'Proteínas (g)': 45,
    'Carbohidratos (g)': 55,
    'Grasas (g)': 12,
    'Ingredientes': 'Pechuga de pollo 200g; Quinoa 100g; Ensalada verde 150g; Limón 1 unidad',
    'Porciones': 1,
    'Minutos': 30,
    'video_url': ''
  },
  {
    'Nombre': 'Salmón al horno con verduras',
    'Descripción': '1. Precalienta el horno a 180°C. 2. Coloca 200g de salmón en papel aluminio con limón y eneldo. 3. Cocina por 20 minutos. 4. Acompaña con brócoli y zanahorias al vapor.',
    'Calorías': 450,
    'Proteínas (g)': 35,
    'Carbohidratos (g)': 25,
    'Grasas (g)': 22,
    'Ingredientes': 'Salmón 200g; Brócoli 150g; Zanahorias 100g; Limón 1 unidad; Eneldo 5g',
    'Porciones': 1,
    'Minutos': 40,
    'video_url': ''
  },
  {
    'Nombre': 'Yogur griego con nueces',
    'Descripción': '1. Mezcla 200g de yogur griego natural. 2. Agrega 30g de nueces picadas. 3. Endulza con stevia si es necesario.',
    'Calorías': 280,
    'Proteínas (g)': 20,
    'Carbohidratos (g)': 15,
    'Grasas (g)': 18,
    'Ingredientes': 'Yogur griego natural 200g; Nueces 30g; Stevia al gusto',
    'Porciones': 1,
    'Minutos': 5,
    'video_url': ''
  },
  {
    'Nombre': 'Tostadas integrales con aguacate y huevo',
    'Descripción': '1. Tuesta 2 rebanadas de pan integral. 2. Unta medio aguacate machacado. 3. Agrega 2 huevos pochados o revueltos. 4. Condimenta con sal, pimienta y semillas de chía.',
    'Calorías': 420,
    'Proteínas (g)': 22,
    'Carbohidratos (g)': 35,
    'Grasas (g)': 20,
    'Ingredientes': 'Pan integral 2 rebanadas; Aguacate 0.5 unidad; Huevos 2 unidades; Semillas de chía 5g',
    'Porciones': 1,
    'Minutos': 15,
    'video_url': ''
  },
  {
    'Nombre': 'Ensalada de atún y garbanzos',
    'Descripción': '1. Mezcla 150g de atún en agua escurrido. 2. Agrega 100g de garbanzos cocidos. 3. Combina con lechuga, tomate, pepino y cebolla. 4. Aliña con aceite de oliva y limón.',
    'Calorías': 480,
    'Proteínas (g)': 38,
    'Carbohidratos (g)': 40,
    'Grasas (g)': 18,
    'Ingredientes': 'Atún en agua 150g; Garbanzos cocidos 100g; Lechuga 80g; Tomate 100g; Pepino 80g; Cebolla 50g; Aceite de oliva 10ml',
    'Porciones': 1,
    'Minutos': 20,
    'video_url': ''
  },
  {
    'Nombre': 'Batido de proteína y plátano',
    'Descripción': '1. Mezcla 1 scoop de proteína en polvo. 2. Agrega medio plátano. 3. Combina con 200ml de leche desnatada o agua. 4. Licúa hasta obtener consistencia cremosa.',
    'Calorías': 250,
    'Proteínas (g)': 25,
    'Carbohidratos (g)': 30,
    'Grasas (g)': 3,
    'Ingredientes': 'Proteína en polvo 1 scoop; Plátano 0.5 unidad; Leche desnatada 200ml',
    'Porciones': 1,
    'Minutos': 5,
    'video_url': ''
  },
  {
    'Nombre': 'Pancakes de avena y plátano',
    'Descripción': '1. Mezcla 60g de avena molida, 1 plátano maduro y 2 huevos. 2. Cocina en sartén antiadherente. 3. Sirve con frutos rojos y un chorrito de miel.',
    'Calorías': 380,
    'Proteínas (g)': 18,
    'Carbohidratos (g)': 50,
    'Grasas (g)': 12,
    'Ingredientes': 'Avena molida 60g; Plátano 1 unidad; Huevos 2 unidades; Frutos rojos 100g; Miel 10g',
    'Porciones': 2,
    'Minutos': 20,
    'video_url': ''
  },
  {
    'Nombre': 'Pavo con batata y espárragos',
    'Descripción': '1. Cocina 200g de pechuga de pavo a la plancha. 2. Hornea 200g de batata cortada en rodajas. 3. Saltea espárragos verdes con ajo. 4. Sirve todo junto.',
    'Calorías': 490,
    'Proteínas (g)': 42,
    'Carbohidratos (g)': 50,
    'Grasas (g)': 10,
    'Ingredientes': 'Pechuga de pavo 200g; Batata 200g; Espárragos verdes 150g; Ajo 2 dientes',
    'Porciones': 1,
    'Minutos': 35,
    'video_url': ''
  },
  {
    'Nombre': 'Ensalada de salmón ahumado',
    'Descripción': '1. Coloca 150g de salmón ahumado sobre lechuga. 2. Agrega aguacate, pepino y tomates cherry. 3. Aliña con aceite de oliva, limón y eneldo fresco.',
    'Calorías': 400,
    'Proteínas (g)': 30,
    'Carbohidratos (g)': 15,
    'Grasas (g)': 25,
    'Ingredientes': 'Salmón ahumado 150g; Lechuga 100g; Aguacate 80g; Pepino 100g; Tomates cherry 100g; Aceite de oliva 15ml',
    'Porciones': 1,
    'Minutos': 15,
    'video_url': ''
  }
];

// Catálogo de opciones (se mantiene solo como referencia documental; el backend ignora columnas extras)
const opcionesDict = {
  'Tipo (opcional)': ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación', 'Pre-entreno', 'Post-entreno']
};

// Hoja de estructura
const estructuraRows = [
  {
    Columna: 'Nombre',
    'Formato / Tipo': 'Texto (max 255 caracteres)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Obligatoria. Nombre único del plato.'
  },
  {
    Columna: 'Descripción',
    'Formato / Tipo': 'Texto libre (max 2000 caracteres)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Descripción o receta del plato. Puede incluir pasos separados por punto y coma (;).'
  },
  {
    Columna: 'Calorías',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Debe ser >= 0. Valores no numéricos se rechazan.'
  },
  {
    Columna: 'Proteínas (g)',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Debe ser >= 0. Valores no numéricos se rechazan.'
  },
  {
    Columna: 'Carbohidratos (g)',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Debe ser >= 0. Valores no numéricos se rechazan.'
  },
  {
    Columna: 'Grasas (g)',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Debe ser >= 0. Valores no numéricos se rechazan.'
  },
  {
    Columna: 'Ingredientes',
    'Formato / Tipo': 'Texto libre',
    'Permite múltiples valores': 'Sí',
    'Cómo indicar varias opciones': "Separar cada ingrediente con '; ' (ej. 'Avena 50g; Proteína 1 scoop').",
    Validación: 'Opcional. Lista de ingredientes con cantidades.'
  },
  {
    Columna: 'Porciones',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Número de porciones que rinde la receta.'
  },
  {
    Columna: 'Minutos',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Tiempo de preparación en minutos.'
  },
  {
    Columna: 'video_url',
    'Formato / Tipo': 'URL de video (opcional)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. URL del video de la receta (Vimeo, YouTube, etc.).'
  }
];

// Hoja de guía
const guiaRows = [
  {
    Paso: 1,
    Indicaciones: 'Descargá este archivo de ejemplo. La hoja "Plantilla" trae recetas de referencia para que veas el formato esperado.'
  },
  {
    Paso: 2,
    Indicaciones: 'Completá tus platos sobre la hoja "Plantilla". Usá las hojas "Opciones" y "Estructura" para validar qué valores son válidos y cómo separarlos.'
  },
  {
    Paso: 3,
    Indicaciones: 'No cambies el nombre de las hojas ni de las columnas. Al subir el Excel, la plataforma sólo leerá la hoja "Plantilla", convertirá los datos y descartará las otras hojas.'
  },
  {
    Paso: 4,
    Indicaciones: 'Si querés, podés agregar una columna extra llamada "Tipo" (Desayuno, Almuerzo, etc.). La plataforma la ignorará en el CSV pero puede usarse luego como referencia interna.'
  },
  {
    Paso: 5,
    Indicaciones: 'Si una columna tiene valores fuera del catálogo o datos inválidos, esa fila se marcará con error y no se importará hasta que la corrijas.'
  }
];

// Crear hojas
const plantillaSheet = XLSX.utils.json_to_sheet(plantillaRows, { header: plantillaHeaders });
XLSX.utils.book_append_sheet(workbook, plantillaSheet, 'Plantilla');

const opcionesHeaders = Object.keys(opcionesDict);
const maxOptions = Math.max(...opcionesHeaders.map(header => opcionesDict[header].length));
const opcionesRows = Array.from({ length: maxOptions }, (_, index) => {
  const row = {};
  opcionesHeaders.forEach(header => {
    row[header] = opcionesDict[header][index] || '';
  });
  return row;
});
const opcionesSheet = XLSX.utils.json_to_sheet(opcionesRows, { header: opcionesHeaders });
XLSX.utils.book_append_sheet(workbook, opcionesSheet, 'Opciones');

const estructuraSheet = XLSX.utils.json_to_sheet(estructuraRows);
XLSX.utils.book_append_sheet(workbook, estructuraSheet, 'Estructura');

const guiaSheet = XLSX.utils.json_to_sheet(guiaRows);
XLSX.utils.book_append_sheet(workbook, guiaSheet, 'Guía');

// Escribir archivo
XLSX.writeFile(workbook, 'plantilla-recetas-nutricion.xlsx');
console.log('✅ Archivo creado: plantilla-recetas-nutricion.xlsx');
console.log(`📊 Total de recetas: ${plantillaRows.length}`);



