import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface MissingProfileAlertProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onContinueGeneric: () => void
    missingFields: string[] // 'weight', 'gender', 'age'
}

export function MissingProfileAlert({
    open,
    onOpenChange,
    onContinueGeneric,
    missingFields
}: MissingProfileAlertProps) {
    const router = useRouter()

    const handleCompleteProfile = () => {
        onOpenChange(false)
        router.push('/profile-setup') // Or wherever the profile edit page is
    }

    // Translate missing fields to Spanish
    const translatedFields = missingFields.map(field => {
        switch (field) {
            case 'weight': return 'Peso';
            case 'gender': return 'Género';
            case 'age': return 'Edad';
            default: return field;
        }
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white max-w-sm rounded-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-full bg-yellow-500/10">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <AlertDialogTitle className="text-lg font-bold">Optimización Pendiente</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
                        Tu perfil no está completo. Nos falta tu <span className="text-[#FF7939] font-medium">{translatedFields.join(', ')}</span>.
                        <br /><br />
                        Este programa puede adaptarse automáticamente a tu cuerpo para darte mejores resultados.
                        <br /><br />
                        ¿Deseas completar tu perfil ahora o prefieres continuar con el plan genérico?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-3 space-y-0 mt-4 sm:flex-col">
                    <Button
                        onClick={handleCompleteProfile}
                        className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white font-semibold rounded-xl"
                    >
                        Completar mi Perfil
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onContinueGeneric}
                        className="w-full text-gray-400 hover:text-white hover:bg-white/5 rounded-xl h-auto py-2"
                    >
                        Continuar con Plan Genérico
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
