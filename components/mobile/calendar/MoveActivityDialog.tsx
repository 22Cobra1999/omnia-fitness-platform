"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"

interface MoveActivityDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceDate: Date | null
    targetDate: Date | null
    isUpdating: boolean
    onConfirm: () => void
    applyToAllSameDays: boolean
    setApplyToAllSameDays: (checked: boolean) => void
    getDayName: (dayIndex: number) => string
}

export function MoveActivityDialog({
    open,
    onOpenChange,
    sourceDate,
    targetDate,
    isUpdating,
    onConfirm,
    applyToAllSameDays,
    setApplyToAllSameDays,
    getDayName
}: MoveActivityDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1C1F] border-zinc-800 text-white w-[90%] max-w-sm rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg">Mover actividades</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        ¿Estás seguro que quieres cambiar la fecha de estas actividades?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-[#141414] rounded-xl p-4 my-2 border border-zinc-800 flex items-center justify-between">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 uppercase">De</span>
                        <span className="text-xl font-bold text-white">{sourceDate?.getDate()}</span>
                        <span className="text-xs text-[#FF7939]">{sourceDate && getDayName(sourceDate.getDay())}</span>
                    </div>

                    <ArrowRight className="text-gray-600" />

                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 uppercase">A</span>
                        <span className="text-xl font-bold text-white">{targetDate?.getDate()}</span>
                        <span className="text-xs text-green-500">{targetDate && getDayName(targetDate.getDay())}</span>
                    </div>
                </div>

                {sourceDate && (
                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Checkbox
                            id="apply-all"
                            checked={applyToAllSameDays}
                            onCheckedChange={(checked) => setApplyToAllSameDays(checked as boolean)}
                            className="mt-0.5 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="apply-all"
                                className="text-sm font-medium leading-none text-blue-100 cursor-pointer"
                            >
                                Mover todos los {getDayName(sourceDate.getDay())}s futuros
                            </Label>
                            <p className="text-xs text-blue-200/70">
                                Esto aplicará el mismo cambio a todos los {getDayName(sourceDate.getDay())}s en el futuro.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex gap-2 sm:justify-end mt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 text-gray-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className="flex-1 bg-[#FF7939] hover:bg-[#FF6A00] text-white"
                    >
                        {isUpdating ? 'Guardando...' : 'Confirmar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
