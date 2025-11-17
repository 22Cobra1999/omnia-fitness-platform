"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDebounce } from '@/hooks/shared/use-debounce'

interface ImageUrlInputProps {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  label?: string
  placeholder?: string
}

export function ImageUrlInput({
  id,
  name,
  value,
  onChange,
  label = "URL de imagen",
  placeholder = "https://ejemplo.com/imagen.jpg",
}: ImageUrlInputProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const debouncedValue = useDebounce(value, 500)

  useEffect(() => {
    const validateImageUrl = async () => {
      if (!debouncedValue) {
        setIsValid(true)
        return
      }

      setIsValidating(true)

      try {
        const response = await fetch("/api/optimize-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl: debouncedValue }),
        })

        setIsValid(response.ok)
      } catch (error) {
        console.error("Error validando URL de imagen:", error)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateImageUrl()
  }, [debouncedValue])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`pr-10 ${!isValid && value ? "border-red-500" : ""}`}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          </div>
        )}
        {!isValidating && value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
      </div>
      {!isValid && value && <p className="text-sm text-red-500">La URL de imagen no es válida o no está accesible</p>}
    </div>
  )
}
