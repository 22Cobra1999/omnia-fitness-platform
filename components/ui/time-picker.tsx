"use client"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  time?: string
  setTime: (time: string) => void
}

export function TimePicker({ time, setTime }: TimePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !time && "text-muted-foreground")}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? time : <span>Seleccionar hora</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Seleccionar hora</h4>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full" />
        </div>
      </PopoverContent>
    </Popover>
  )
}
