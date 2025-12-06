const XLSX = require('xlsx');

// Crear workbook
const workbook = XLSX.utils.book_new();

// Headers de la plantilla
const plantillaHeaders = [
  'Nombre de la Actividad',
  'Descripción',
  'Duración (min)',
  'Tipo de Ejercicio',
  'Nivel de Intensidad',
  'Equipo Necesario',
  'Detalle de Series (peso-repeticiones-series)',
  'Partes del Cuerpo',
  'Calorías'
];

// Datos de ejemplo para programa de fútbol (Ronaldinho)
const plantillaRows = [
  {
    'Nombre de la Actividad': 'Calentamiento con balón',
    'Descripción': 'Calentamiento dinámico con ejercicios de dominio del balón, toques y pases cortos.',
    'Duración (min)': 10,
    'Tipo de Ejercicio': 'Cardio',
    'Nivel de Intensidad': 'Bajo',
    'Equipo Necesario': 'Balón de fútbol',
    'Detalle de Series (peso-repeticiones-series)': '(0-30-2)',
    'Partes del Cuerpo': 'Piernas; Caderas; Core',
    'Calorías': 50
  },
  {
    'Nombre de la Actividad': 'Toques de balón alternados',
    'Descripción': 'Ejercicio de técnica individual: toques alternando ambos pies, manteniendo el balón en el aire.',
    'Duración (min)': 15,
    'Tipo de Ejercicio': 'Funcional',
    'Nivel de Intensidad': 'Medio',
    'Equipo Necesario': 'Balón de fútbol',
    'Detalle de Series (peso-repeticiones-series)': '(0-50-3); (0-60-2)',
    'Partes del Cuerpo': 'Piernas; Core; Caderas',
    'Calorías': 80
  },
  {
    'Nombre de la Actividad': 'Conos y regates',
    'Descripción': 'Circuito de regates entre conos trabajando cambios de dirección y velocidad.',
    'Duración (min)': 20,
    'Tipo de Ejercicio': 'Funcional',
    'Nivel de Intensidad': 'Medio',
    'Equipo Necesario': 'Balón de fútbol; Conos',
    'Detalle de Series (peso-repeticiones-series)': '(0-10-4)',
    'Partes del Cuerpo': 'Piernas; Caderas; Core',
    'Calorías': 120
  },
  {
    'Nombre de la Actividad': 'Sprints con balón',
    'Descripción': 'Series de sprints cortos conduciendo el balón a máxima velocidad.',
    'Duración (min)': 12,
    'Tipo de Ejercicio': 'HIIT',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Balón de fútbol',
    'Detalle de Series (peso-repeticiones-series)': '(0-20-6)',
    'Partes del Cuerpo': 'Piernas; Core; Cuerpo Completo',
    'Calorías': 150
  },
  {
    'Nombre de la Actividad': 'Pases y recepción',
    'Descripción': 'Ejercicio de pases precisos y recepción controlada trabajando ambas piernas.',
    'Duración (min)': 18,
    'Tipo de Ejercicio': 'Funcional',
    'Nivel de Intensidad': 'Medio',
    'Equipo Necesario': 'Balón de fútbol',
    'Detalle de Series (peso-repeticiones-series)': '(0-30-4)',
    'Partes del Cuerpo': 'Piernas; Core; Hombros',
    'Calorías': 100
  },
  {
    'Nombre de la Actividad': 'Remates a portería',
    'Descripción': 'Práctica de remates desde diferentes ángulos y distancias.',
    'Duración (min)': 15,
    'Tipo de Ejercicio': 'Fuerza',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Balón de fútbol; Portería',
    'Detalle de Series (peso-repeticiones-series)': '(0-15-5)',
    'Partes del Cuerpo': 'Piernas; Core; Glúteos',
    'Calorías': 130
  },
  {
    'Nombre de la Actividad': 'Estiramientos post-entrenamiento',
    'Descripción': 'Rutina de estiramientos estáticos para piernas, caderas y espalda.',
    'Duración (min)': 10,
    'Tipo de Ejercicio': 'Flexibilidad',
    'Nivel de Intensidad': 'Bajo',
    'Equipo Necesario': 'Mat de yoga',
    'Detalle de Series (peso-repeticiones-series)': '(0-30-1)',
    'Partes del Cuerpo': 'Piernas; Caderas; Espalda',
    'Calorías': 20
  }
];

// Catálogo de opciones
const opcionesDict = {
  'Tipo de Ejercicio': ['Fuerza', 'Cardio', 'HIIT', 'Movilidad', 'Flexibilidad', 'Equilibrio', 'Funcional'],
  'Nivel de Intensidad': ['Bajo', 'Medio', 'Alto'],
  'Equipo Necesario': ['', 'Bandas', 'Banco', 'Barra', 'Chaleco', 'Kettlebell', 'Mancuernas', 'Máquinas', 'Mat de yoga', 'Rack', 'Balón de fútbol', 'Conos', 'Portería'],
  'Partes del Cuerpo': ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Antebrazos', 'Core', 'Glúteos', 'Piernas', 'Cuádriceps', 'Isquiotibiales', 'Pantorrillas', 'Caderas', 'Cuerpo Completo']
};

// Hoja de estructura
const estructuraRows = [
  {
    Columna: 'Nombre de la Actividad',
    'Formato / Tipo': 'Texto (max 100 caracteres)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Obligatoria. No puede repetirse con otro registro existente para evitar duplicados.'
  },
  {
    Columna: 'Descripción',
    'Formato / Tipo': 'Texto libre (max 255 caracteres)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. El sistema la acepta vacía.'
  },
  {
    Columna: 'Duración (min)',
    'Formato / Tipo': 'Número entero positivo',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Obligatoria. Debe ser >= 1. Valores no numéricos se rechazan.'
  },
  {
    Columna: 'Tipo de Ejercicio',
    'Formato / Tipo': 'Texto (catálogo)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Obligatoria. Debe coincidir con alguna opción listada en la hoja "Opciones".'
  },
  {
    Columna: 'Nivel de Intensidad',
    'Formato / Tipo': 'Texto (catálogo)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Obligatoria. Debe coincidir con la hoja "Opciones". Valores fuera de catálogo se marcan como error.'
  },
  {
    Columna: 'Equipo Necesario',
    'Formato / Tipo': 'Texto (catálogo)',
    'Permite múltiples valores': 'Sí',
    'Cómo indicar varias opciones': "Separar cada equipo con '; ' (ej. 'Bandas; Mancuernas'). Dejar vacío si no aplica.",
    Validación: 'Opcional. Cada palabra debe estar en la hoja "Opciones". Si existe uno inválido, la fila se marca con error pero se mantiene para revisión.'
  },
  {
    Columna: 'Detalle de Series (peso-repeticiones-series)',
    'Formato / Tipo': 'Texto estructurado',
    'Permite múltiples valores': 'Sí',
    'Cómo indicar varias opciones': "Cada bloque entre paréntesis en formato (peso-reps-series) y separados por '; '.",
    Validación: 'Opcional. El sistema muestra advertencia si el formato no respeta los paréntesis.'
  },
  {
    Columna: 'Partes del Cuerpo',
    'Formato / Tipo': 'Texto (catálogo)',
    'Permite múltiples valores': 'Sí',
    'Cómo indicar varias opciones': "Separar con '; ' (ej. 'Core; Espalda').",
    Validación: 'Obligatoria. Cada valor debe estar en la hoja "Opciones". Valores fuera de catálogo generan error y no se cargan.'
  },
  {
    Columna: 'Calorías',
    'Formato / Tipo': 'Número entero (aprox.)',
    'Permite múltiples valores': 'No',
    'Cómo indicar varias opciones': '-',
    Validación: 'Opcional. Si se completa, debe ser un número >= 0.'
  }
];

// Hoja de guía
const guiaRows = [
  {
    Paso: 1,
    Indicaciones: 'Descargá este archivo de ejemplo. La hoja "Plantilla" trae ejercicios de fútbol de referencia para que veas el formato esperado.'
  },
  {
    Paso: 2,
    Indicaciones: 'Completá tus ejercicios sobre la hoja "Plantilla". Usá las hojas "Opciones" y "Estructura" para validar qué valores son válidos y cómo separarlos.'
  },
  {
    Paso: 3,
    Indicaciones: 'No cambies el nombre de las hojas ni de las columnas. Al subir el Excel, la plataforma sólo leerá la hoja "Plantilla", convertirá los datos y descartará las otras hojas.'
  },
  {
    Paso: 4,
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
XLSX.writeFile(workbook, 'plantilla-futbol-ronaldinho.xlsx');
console.log('✅ Archivo creado: plantilla-futbol-ronaldinho.xlsx');





