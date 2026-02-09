
interface GenerateTemplateProps {
    productCategory: 'fitness' | 'nutricion'
}

export const generateCsvTemplate = ({ productCategory }: GenerateTemplateProps) => {
    let filename = ''
    let csvContent = ''

    if (productCategory === 'nutricion') {
        const headers = [
            'Nombre', 'Receta', 'Calorías', 'Proteínas (g)', 'Carbohidratos (g)',
            'Grasas (g)', 'Dificultad', 'Ingredientes', 'Porciones', 'Minutos'
        ]
        const sampleRows = [
            ['Pollo con Arroz', '1. Hervir arroz; 2. Grillar pollo; 3. Servir', '450', '40', '50', '10', 'Principiante', 'Pechuga de pollo (150g); Arroz integral (200g)', '1', '25'],
            ['Ensalada de Atún', '1. Abrir lata; 2. Picar lechuga; 3. Mezclar', '300', '25', '10', '15', 'Principiante', 'Lata de atún; Lechuga; Tomate', '1', '10']
        ]
        filename = 'plantilla_nutricion.csv'
        csvContent = [
            headers.join(','),
            ...sampleRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n')
    } else {
        const headers = [
            'Nombre de la Actividad', 'Descripción', 'Duración (min)', 'Tipo de Ejercicio',
            'Nivel de Intensidad', 'Equipo Necesario', 'Detalle de Series (peso-repeticiones-series)',
            'Partes del Cuerpo', 'Calorías'
        ]
        const sampleRows = [
            ['Sentadillas', 'Mantener espalda recta', '15', 'fuerza', 'Medio', 'Barra', '60-12-3', 'Piernas; Glúteos', '150'],
            ['Flexiones de Brazos', 'Codos a 45 grados', '10', 'fuerza', 'Medio', 'ninguno', '0-15-4', 'Pecho; Tríceps', '80']
        ]
        filename = 'plantilla_fitness.csv'
        csvContent = [
            headers.join(','),
            ...sampleRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
