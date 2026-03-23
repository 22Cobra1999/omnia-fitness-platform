import React, { useState, useEffect, useCallback } from 'react'
import { Plus, X, Search, Check } from 'lucide-react'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DictionaryAutocompleteProps {
    value: string
    onChange: (newValue: string) => void
    categoria: 'equipo_fitness' | 'parte_cuerpo' | 'nutricion' | 'ingrediente'
    placeholder?: string
    label?: string
}

export function DictionaryAutocomplete({
    value,
    onChange,
    categoria,
    placeholder = 'Escribir...',
    label
}: DictionaryAutocompleteProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const selectedItems = value?.split(';').filter(Boolean).map(i => i.trim()) || []

    const fetchSuggestions = useCallback(async (q: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/dictionary?categoria=${categoria}&query=${q}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setSuggestions(data)
            }
        } catch (error) {
            console.error('Error fetching dictionary suggestions:', error)
        } finally {
            setLoading(false)
        }
    }, [categoria])

    useEffect(() => {
        if (open || query) {
            const timeout = setTimeout(() => {
                fetchSuggestions(query)
            }, 300)
            return () => clearTimeout(timeout)
        }
    }, [query, open, fetchSuggestions])

    const handleSelect = (item: string) => {
        if (!selectedItems.includes(item)) {
            const newValue = value ? `${value};${item}` : item
            onChange(newValue)
        }
        setOpen(false)
        setQuery('')
    }

    const handleAddNew = async () => {
        const itemToTranslate = query.trim()
        if (!itemToTranslate || selectedItems.includes(itemToTranslate)) return

        // Optimistic update
        handleSelect(itemToTranslate)

        // Save to dictionary
        try {
            await fetch('/api/dictionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concepto: itemToTranslate, categoria })
            })
        } catch (error) {
            console.error('Error saving to dictionary:', error)
        }
    }

    const removeItemSelected = (itemToRemove: string) => {
        const newValue = selectedItems
            .filter(i => i !== itemToRemove)
            .join(';')
        onChange(newValue)
    }

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] p-2 bg-zinc-900/40 rounded-lg border border-zinc-800">
                {selectedItems.length === 0 && (
                    <span className="text-zinc-500 text-xs italic py-1">Ninguno seleccionado...</span>
                )}
                {selectedItems.map((item, idx) => (
                    <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center gap-1.5 px-2 py-1 border-white/5 shadow-sm transition-all animate-in fade-in zoom-in duration-200"
                    >
                        {item}
                        <button
                            onClick={() => removeItemSelected(item)}
                            className="bg-zinc-600/50 hover:bg-red-500/80 rounded-full p-0.5 transition-colors"
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </Badge>
                ))}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-zinc-900/40 border-zinc-800 text-zinc-400 font-normal h-10 hover:bg-zinc-800/60 hover:text-white transition-all shadow-inner"
                    >
                        <span className="truncate">{placeholder}</span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden" align="start">
                    <Command className="bg-transparent" shouldFilter={false}>
                        <CommandInput 
                            placeholder={`Buscar ${label || 'concepto'}...`}
                            value={query}
                            onValueChange={setQuery}
                            className="text-white border-b border-white/5 h-12"
                        />
                        <CommandList className="max-h-[300px]">
                            {loading && <div className="p-4 text-center text-zinc-500 text-xs animate-pulse">Buscando sugerencias...</div>}
                            
                            {!loading && query.trim() !== '' && !suggestions.find(s => s.toLowerCase() === query.toLowerCase().trim()) && (
                                <CommandGroup>
                                    <CommandItem
                                        value={query}
                                        onSelect={handleAddNew}
                                        className="text-[#FF7939] font-bold p-3 cursor-pointer hover:bg-[#FF7939]/10"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar nuevo: "{query}"
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            <CommandGroup heading="Sugerencias" className="text-zinc-500 text-[10px] uppercase tracking-widest px-4 pt-4 pb-2">
                                {suggestions.length > 0 ? (
                                    suggestions
                                      .filter(s => !selectedItems.includes(s))
                                      .map((s) => (
                                        <CommandItem
                                            key={s}
                                            value={s}
                                            onSelect={() => handleSelect(s)}
                                            className="text-zinc-100 p-3 flex justify-between items-center group cursor-pointer hover:bg-white/5"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-[#FF7939] mr-3 transition-colors" />
                                                {s}
                                            </div>
                                            {selectedItems.includes(s) && <Check className="h-4 w-4 text-[#FF7939]" />}
                                        </CommandItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-zinc-600 text-xs">No hay sugerencias predefinidas</div>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
