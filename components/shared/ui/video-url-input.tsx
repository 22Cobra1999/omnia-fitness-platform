"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { extractVimeoId, isVimeoEmbed } from "@/utils/vimeo-utils"

interface VideoUrlInputProps {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function VideoUrlInput({
  id,
  name,
  value,
  onChange,
  label = "URL del video",
  placeholder = "https://vimeo.com/123456789",
  required = false,
}: VideoUrlInputProps) {
  const [vimeoId, setVimeoId] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)
  const [displayValue, setDisplayValue] = useState(value)

  // Actualizar el ID de Vimeo cuando cambia el valor
  useEffect(() => {
    if (value) {
      // Si es un código de inserción, extraemos el ID y mostramos la URL simple
      if (isVimeoEmbed(value)) {
        const id = extractVimeoId(value)
        setVimeoId(id)
        setIsValid(!!id)
        // No actualizamos displayValue para mantener el código de inserción original
      } else {
        // Si es una URL simple, extraemos el ID
        const id = extractVimeoId(value)
        setVimeoId(id)
        setIsValid(!!id)
        setDisplayValue(value)
      }
    } else {
      setVimeoId(null)
      setIsValid(true)
      setDisplayValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)

    // Creamos un evento sintético con el valor original
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue,
      },
    }

    onChange(syntheticEvent)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={!isValid ? "text-red-500" : ""}>
        {label} {required && "*"}
      </Label>
      <Input
        id={id}
        name={name}
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={!isValid ? "border-red-500" : ""}
        required={required}
      />
      {vimeoId && <div className="text-xs text-green-600">ID de Vimeo detectado: {vimeoId}</div>}
      {!isValid && value && (
        <div className="text-xs text-red-500">
          No se pudo detectar un ID de Vimeo válido. Asegúrate de usar una URL de Vimeo o un código de inserción válido.
        </div>
      )}
    </div>
  )
}
