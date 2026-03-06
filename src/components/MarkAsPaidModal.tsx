import React, { useState } from 'react'
import { Check, CreditCard, DollarSign, Smartphone, X, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { supabase } from '../utils/supabase'
import { cn } from '../utils/cn'

interface MarkAsPaidModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    appointmentId: string
    amount: number
    clientName: string
}

type PaymentMethod = 'pix' | 'card' | 'cash'

const methods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'pix', label: 'PIX', icon: Smartphone },
    { id: 'card', label: 'Cartão', icon: CreditCard },
    { id: 'cash', label: 'Dinheiro', icon: DollarSign },
]

export const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    appointmentId,
    amount,
    clientName
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('payments')
                .insert({
                    appointment_id: appointmentId,
                    amount: amount,
                    method: selectedMethod,
                    status: 'paid',
                    payment_date: new Date().toISOString()
                })

            if (error) throw error
            onSuccess()
            onClose()
        } catch (err) {
            console.error('Erro ao registrar pagamento:', err)
            alert('Não foi possível registrar o pagamento.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-dark/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 w-10 h-10 bg-cream-light rounded-full flex items-center justify-center text-dark/20 hover:text-dark transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-8">
                    <h3 className="text-2xl font-display font-bold text-dark mb-2">Registrar Pagamento</h3>
                    <p className="text-dark/40 font-medium">
                        Confirmar recebimento de <span className="text-sage-dark font-bold">R$ {amount}</span> para <span className="text-dark font-bold">{clientName}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-8">
                    {methods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={cn(
                                "flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300",
                                selectedMethod === method.id
                                    ? "bg-sage/10 border-sage shadow-ios scale-[1.02]"
                                    : "bg-white border-cream-dark/30 hover:border-sage/30 hover:bg-cream-light/50"
                            )}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                    selectedMethod === method.id ? "bg-sage text-white" : "bg-cream-light text-dark/30"
                                )}>
                                    <method.icon size={24} />
                                </div>
                                <span className={cn(
                                    "font-bold text-lg",
                                    selectedMethod === method.id ? "text-sage-dark" : "text-dark/60"
                                )}>
                                    {method.label}
                                </span>
                            </div>
                            {selectedMethod === method.id && (
                                <div className="w-6 h-6 bg-sage rounded-full flex items-center justify-center text-white">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button
                        className="h-16 text-lg font-bold shadow-ios active:scale-95"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Confirmar Recebimento"}
                    </Button>
                    <button
                        onClick={onClose}
                        className="h-12 text-dark/30 font-bold uppercase text-xs tracking-widest hover:text-dark/60 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
