import { Input } from "@/components/ui/input"

interface TimeValue {
    hours: number
    minutes: number
    seconds: number
}

interface TimeInputProps {
    value: TimeValue
    onChange: (value: TimeValue) => void
}

export function TimeInput({ value, onChange }: TimeInputProps) {
    return (
        <div className="flex items-center gap-1 bg-[#0F1012] border border-white/10 rounded-xl px-2 h-11">
            <Input
                type="number"
                min="0"
                value={value.hours || ''}
                onChange={(e) => onChange({ ...value, hours: parseInt(e.target.value) || 0 })}
                className="w-full bg-transparent border-none text-center p-0 h-full focus-visible:ring-0"
                placeholder="HH"
            />
            <span className="text-gray-500">:</span>
            <Input
                type="number"
                min="0"
                max="59"
                value={value.minutes || ''}
                onChange={(e) => onChange({ ...value, minutes: parseInt(e.target.value) || 0 })}
                className="w-full bg-transparent border-none text-center p-0 h-full focus-visible:ring-0"
                placeholder="MM"
            />
            <span className="text-gray-500">:</span>
            <Input
                type="number"
                min="0"
                max="59"
                value={value.seconds || ''}
                onChange={(e) => onChange({ ...value, seconds: parseInt(e.target.value) || 0 })}
                className="w-full bg-transparent border-none text-center p-0 h-full focus-visible:ring-0"
                placeholder="SS"
            />
        </div>
    )
}
