"use client"

import { useState, useCallback } from 'react'

interface DayValidationResult {
  isValid: boolean
  normalizedDay: string
  suggestions: string[]
}

export function useDayValidation() {
  const [daySuggestions, setDaySuggestions] = useState<Record<string, string[]>>({})

  // Mapeo de días con variaciones de tildes y mayúsculas
  const dayMappings: Record<string, string> = {
    // Lunes
    'lunes': 'Lunes',
    'LUNES': 'Lunes',
    'Lunes': 'Lunes',
    'LUNES': 'Lunes',
    
    // Martes
    'martes': 'Martes',
    'MARTES': 'Martes',
    'Martes': 'Martes',
    'MARTES': 'Martes',
    
    // Miércoles
    'miercoles': 'Miércoles',
    'miércoles': 'Miércoles',
    'MIERCOLES': 'Miércoles',
    'MIÉRCOLES': 'Miércoles',
    'Miercoles': 'Miércoles',
    'Miércoles': 'Miércoles',
    'MIERCOLES': 'Miércoles',
    'MIÉRCOLES': 'Miércoles',
    
    // Jueves
    'jueves': 'Jueves',
    'JUEVES': 'Jueves',
    'Jueves': 'Jueves',
    'JUEVES': 'Jueves',
    
    // Viernes
    'viernes': 'Viernes',
    'VIERNES': 'Viernes',
    'Viernes': 'Viernes',
    'VIERNES': 'Viernes',
    
    // Sábado
    'sabado': 'Sábado',
    'sábado': 'Sábado',
    'SABADO': 'Sábado',
    'SÁBADO': 'Sábado',
    'Sabado': 'Sábado',
    'Sábado': 'Sábado',
    'SABADO': 'Sábado',
    'SÁBADO': 'Sábado',
    
    // Domingo
    'domingo': 'Domingo',
    'DOMINGO': 'Domingo',
    'Domingo': 'Domingo',
    'DOMINGO': 'Domingo'
  }

  const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const validateAndNormalizeDay = useCallback((input: string): DayValidationResult => {
    const trimmedInput = input.trim()
    
    if (!trimmedInput) {
      return {
        isValid: false,
        normalizedDay: '',
        suggestions: validDays
      }
    }

    // Buscar coincidencia exacta
    const normalizedDay = dayMappings[trimmedInput]
    if (normalizedDay) {
      return {
        isValid: true,
        normalizedDay,
        suggestions: []
      }
    }

    // Buscar coincidencias parciales para sugerencias
    const suggestions = validDays.filter(day => 
      day.toLowerCase().includes(trimmedInput.toLowerCase()) ||
      day.toLowerCase().replace(/[áéíóú]/g, (match) => {
        const map: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' }
        return map[match] || match
      }).includes(trimmedInput.toLowerCase())
    )

    return {
      isValid: false,
      normalizedDay: '',
      suggestions: suggestions.length > 0 ? suggestions : validDays
    }
  }, [])

  const isValidDay = useCallback((input: string): boolean => {
    return validateAndNormalizeDay(input).isValid
  }, [validateAndNormalizeDay])

  const getDaySuggestions = useCallback((input: string): string[] => {
    return validateAndNormalizeDay(input).suggestions
  }, [validateAndNormalizeDay])

  return {
    validateAndNormalizeDay,
    isValidDay,
    getDaySuggestions,
    daySuggestions,
    setDaySuggestions,
    validDays
  }
}
