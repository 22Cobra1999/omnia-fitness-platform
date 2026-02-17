
import { Check } from 'lucide-react'
import { PLAN_FEATURES } from './data/plan-data'

export const PlanFeaturesTable = () => {
    return (
        <div className={`pt-6 border-t border-white/10 transition-all mt-6`}>
            <h4 className="text-sm font-medium text-white mb-4">Comparativa Completa</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 text-gray-400 font-medium">Característica</th>
                            <th className="text-center py-3 text-gray-400 font-medium">Free</th>
                            <th className="text-center py-3 text-gray-400 font-medium">Básico</th>
                            <th className="text-center py-3 text-gray-400 font-medium">Black</th>
                            <th className="text-center py-3 text-gray-400 font-medium">Premium</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PLAN_FEATURES.map((feature, idx) => (
                            <tr key={idx} className="border-b border-white/5">
                                <td className="py-3 text-gray-300 font-bold">{feature.name === 'Clientes recomendados' ? 'Clientes totales' : feature.name}</td>
                                <td className="text-center py-3">
                                    {typeof feature.free === 'boolean' ? (
                                        feature.free ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                                    ) : (
                                        <span className="text-gray-400 font-bold">{feature.free}</span>
                                    )}
                                </td>
                                <td className="text-center py-3">
                                    {typeof feature.basico === 'boolean' ? (
                                        feature.basico ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                                    ) : (
                                        <span className="text-gray-400 font-bold">{feature.basico}</span>
                                    )}
                                </td>
                                <td className="text-center py-3">
                                    {typeof feature.black === 'boolean' ? (
                                        feature.black ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                                    ) : (
                                        <span className="text-gray-400 font-bold">{feature.black}</span>
                                    )}
                                </td>
                                <td className="text-center py-3">
                                    {typeof feature.premium === 'boolean' ? (
                                        feature.premium ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                                    ) : (
                                        <span className="text-gray-400 font-bold">{feature.premium}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
