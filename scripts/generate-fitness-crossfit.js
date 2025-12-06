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

// Datos de ejemplo para programa de Fuerza/CrossFit
const plantillaRows = [
  {
    'Nombre de la Actividad': 'Deadlift',
    'Descripción': 'Levantamiento de peso muerto trabajando cadena posterior completa.',
    'Duración (min)': 20,
    'Tipo de Ejercicio': 'Fuerza',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Barra',
    'Detalle de Series (peso-repeticiones-series)': '(60-8-3); (80-5-2); (100-3-1)',
    'Partes del Cuerpo': 'Espalda; Glúteos; Isquiotibiales; Core',
    'Calorías': 120
  },
  {
    'Nombre de la Actividad': 'Thruster',
    'Descripción': 'Movimiento compuesto: sentadilla + press de hombros con barra o mancuernas.',
    'Duración (min)': 15,
    'Tipo de Ejercicio': 'Fuerza',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Barra; Mancuernas',
    'Detalle de Series (peso-repeticiones-series)': '(40-10-3); (35-12-2)',
    'Partes del Cuerpo': 'Piernas; Hombros; Core; Glúteos',
    'Calorías': 150
  },
  {
    'Nombre de la Actividad': 'Burpees',
    'Descripción': 'Movimiento funcional completo: flexión, salto y extensión.',
    'Duración (min)': 10,
    'Tipo de Ejercicio': 'HIIT',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': '',
    'Detalle de Series (peso-repeticiones-series)': '(0-15-4); (0-20-3)',
    'Partes del Cuerpo': 'Cuerpo Completo; Core; Piernas',
    'Calorías': 100
  },
  {
    'Nombre de la Actividad': 'Kettlebell Swing',
    'Descripción': 'Balanceo de kettlebell trabajando cadera y core.',
    'Duración (min)': 12,
    'Tipo de Ejercicio': 'Funcional',
    'Nivel de Intensidad': 'Medio',
    'Equipo Necesario': 'Kettlebell',
    'Detalle de Series (peso-repeticiones-series)': '(16-20-3); (20-15-2)',
    'Partes del Cuerpo': 'Glúteos; Core; Espalda; Piernas',
    'Calorías': 110
  },
  {
    'Nombre de la Actividad': 'Pull-ups',
    'Descripción': 'Dominadas trabajando espalda, brazos y core.',
    'Duración (min)': 15,
    'Tipo de Ejercicio': 'Fuerza',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Barra',
    'Detalle de Series (peso-repeticiones-series)': '(0-8-4); (0-10-3)',
    'Partes del Cuerpo': 'Espalda; Brazos; Core',
    'Calorías': 80
  },
  {
    'Nombre de la Actividad': 'Box Jumps',
    'Descripción': 'Saltos sobre caja trabajando potencia y explosividad.',
    'Duración (min)': 10,
    'Tipo de Ejercicio': 'Funcional',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Caja',
    'Detalle de Series (peso-repeticiones-series)': '(0-12-4)',
    'Partes del Cuerpo': 'Piernas; Glúteos; Core',
    'Calorías': 90
  },
  {
    'Nombre de la Actividad': 'Wall Ball',
    'Descripción': 'Lanzamiento de balón medicinal contra la pared desde sentadilla.',
    'Duración (min)': 12,
    'Tipo de Ejercicio': 'Funcional',
    'Nivel de Intensidad': 'Medio',
    'Equipo Necesario': 'Balón medicinal',
    'Detalle de Series (peso-repeticiones-series)': '(9-15-3); (9-20-2)',
    'Partes del Cuerpo': 'Piernas; Hombros; Core',
    'Calorías': 100
  },
  {
    'Nombre de la Actividad': 'Double Unders',
    'Descripción': 'Saltos con cuerda donde la cuerda pasa dos veces por debajo de los pies.',
    'Duración (min)': 8,
    'Tipo de Ejercicio': 'Cardio',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Cuerda',
    'Detalle de Series (peso-repeticiones-series)': '(0-30-3); (0-50-2)',
    'Partes del Cuerpo': 'Piernas; Core; Cuerpo Completo',
    'Calorías': 70
  },
  {
    'Nombre de la Actividad': 'Muscle-ups',
    'Descripción': 'Movimiento avanzado combinando pull-up y dip en anillas o barra.',
    'Duración (min)': 15,
    'Tipo de Ejercicio': 'Fuerza',
    'Nivel de Intensidad': 'Alto',
    'Equipo Necesario': 'Anillas; Barra',
    'Detalle de Series (peso-repeticiones-series)': '(0-5-3); (0-8-2)',
    'Partes del Cuerpo': 'Espalda; Brazos; Hombros; Core',
    'Calorías': 95
  },
  {
    'Nombre de la Actividad': 'Mobility Flow',
    'Descripción': 'Secuencia de movilidad para recuperación activa y flexibilidad.',
    'Duración (min)': 15,
    'Tipo de Ejercicio': 'Movilidad',
    'Nivel de Intensidad': 'Bajo',
    'Equipo Necesario': 'Mat de yoga',
    'Detalle de Series (peso-repeticiones-series)': '(0-60-1)',
    'Partes del Cuerpo': 'Caderas; Espalda; Core; Piernas',
    'Calorías': 40
  }
];

// Catálogo de opciones
const opcionesDict = {
  'Tipo de Ejercicio': ['Fuerza', 'Cardio', 'HIIT', 'Movilidad', 'Flexibilidad', 'Equilibrio', 'Funcional'],
  'Nivel de Intensidad': ['Bajo', 'Medio', 'Alto'],
  'Equipo Necesario': ['', 'Bandas', 'Banco', 'Barra', 'Chaleco', 'Kettlebell', 'Mancuernas', 'Máquinas', 'Mat de yoga', 'Rack', 'Caja', 'Balón medicinal', 'Cuerda', 'Anillas'],
  'Partes del Cuerpo': ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Antebrazos', 'Core', 'Glúteos', 'Piernas', 'Cuádriceps', 'Isquiotibiales', 'Pantorrillas', 'Caderas', 'Cuerpo Completo']
};

// Hoja de estructura (igual que en fútbol)
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
    Indicaciones: 'Descargá este archivo de ejemplo. La hoja "Plantilla" trae ejercicios de CrossFit y Fuerza de referencia para que veas el formato esperado.'
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
XLSX.writeFile(workbook, 'plantilla-fuerza-crossfit.xlsx');
console.log('✅ Archivo creado: plantilla-fuerza-crossfit.xlsx');





