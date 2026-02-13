export const FITNESS_GOALS_OPTIONS = [
    "Subir de peso",
    "Bajar de peso",
    "Quemar grasas",
    "Ganar masa muscular",
    "Mejorar condición física",
    "Tonificar",
    "Mejorar flexibilidad",
    "Reducir estrés",
    "Controlar respiración",
    "Corregir postura",
    "Meditación y Mindfulness",
    "Equilibrio corporal",
    "Aumentar resistencia",
    "Salud articular"
]

export const SPORTS_OPTIONS = [
    "Fútbol",
    "Tenis",
    "Padel",
    "Natación",
    "Running",
    "Crossfit",
    "Yoga",
    "Pilates",
    "Ciclismo",
    "Boxeo",
    "Artes Marciales",
    "Gimnasio",
    "Básquet",
    "Vóley",
    "Patinaje",
    "Golf",
    "Escalada",
    "Surf",
    "Otro"
]

export const CONTRADICTORY_GOALS: Record<string, string[]> = {
    "Subir de peso": ["Bajar de peso", "Quemar grasas"],
    "Bajar de peso": ["Subir de peso", "Ganar masa muscular"],
    "Quemar grasas": ["Subir de peso"],
    "Ganar masa muscular": ["Bajar de peso"]
}
