import React, { useState, useEffect } from 'react'
import { X, Loader2, Package as PackageIcon, CheckCircle2, Check, Plus, Minus, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { supabase } from '../utils/supabase'
import { Massage, Profile } from '../types/database'
import { cn } from '../utils/cn'

interface CreatePackageModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    client: Profile
}

export const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ isOpen, onClose, onSuccess, client }) => {
    const [loading, setLoading] = useState(false)
    const [massages, setMassages] = useState<Massage[]>([])
    const [packageLimit, setPackageLimit] = useState<number>(4)
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash' | 'unpaid'>('pix')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchMassages()
        }
    }, [isOpen])

    const fetchMassages = async () => {
        const { data } = await supabase.from('massages').select('*').eq('is_active', true).order('price')
        if (data) {
            setMassages(data)
            // Initialize quantities to 0
            const initial: Record<string, number> = {}
            data.forEach(m => initial[m.id] = 0)
            setSelectedQuantities(initial)
        }
    }

    if (!isOpen) return null

    const currentTotalAllocated = Object.values(selectedQuantities).reduce((a, b) => a + b, 0)

    const updateQuantity = (id: string, delta: number) => {
        const current = selectedQuantities[id] || 0
        const newValue = Math.max(0, current + delta)

        // If incrementing, check if we exceed the limit
        if (delta > 0 && currentTotalAllocated >= packageLimit) return

        setSelectedQuantities(prev => ({
            ...prev,
            [id]: newValue
        }))
    }

    const calculateTotalAmount = () => {
        return massages.reduce((acc, m) => {
            const qty = selectedQuantities[m.id] || 0
            if (qty === 0) return acc
            return acc + (Number(m.price) - 20) * qty
        }, 0)
    }

    const totalAmount = calculateTotalAmount()
    const isReady = currentTotalAllocated === packageLimit

    const handleCreate = async () => {
        if (!isReady || !client.id) {
            setError(`Selecione exatamente ${packageLimit} massagens para continuar`)
            return
        }
        setLoading(true)
        setError(null)

        try {
            // 1. Create the package
            const { data: pkg, error: pkgError } = await supabase
                .from('packages')
                .insert({
                    client_id: client.id,
                    total_sessions: packageLimit,
                    remaining_sessions: packageLimit,
                    total_amount: totalAmount,
                    status: 'active'
                })
                .select()
                .single()

            if (pkgError) throw pkgError

            // 2. Create the junction entries with quantities
            const junctionData = Object.entries(selectedQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([mid, qty]) => ({
                    package_id: pkg.id,
                    massage_id: mid,
                    quantity_allowed: qty,
                    quantity_used: 0
                }))

            const { error: junctionError } = await supabase
                .from('package_allowed_massages')
                .insert(junctionData)

            if (junctionError) throw junctionError

            // 3. Create the payment
            if (paymentMethod !== 'unpaid') {
                const { error: payError } = await supabase
                    .from('payments')
                    .insert({
                        package_id: pkg.id,
                        amount: totalAmount,
                        method: paymentMethod,
                        status: 'paid',
                        payment_date: new Date().toISOString()
                    })

                if (payError) throw payError
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao criar pacote')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-dark/40 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                <div className="p-6 border-b border-cream-dark flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center text-sage">
                            <PackageIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-dark">Novo Pacote</h2>
                            <p className="text-[10px] uppercase font-bold text-dark/30 tracking-widest">{client.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-cream-light rounded-full flex items-center justify-center text-dark/40 hover:bg-cream-dark transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Package Size Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-dark/30 ml-1">Total de Massagens</label>
                            <select
                                value={packageLimit}
                                onChange={(e) => {
                                    setPackageLimit(Number(e.target.value))
                                    // Reset counters when changing limit to avoid confusion
                                    const reset: Record<string, number> = {}
                                    massages.forEach(m => reset[m.id] = 0)
                                    setSelectedQuantities(reset)
                                }}
                                className="ios-input w-full h-14"
                            >
                                <option value={2}>2 Massagens</option>
                                <option value={4}>4 Massagens</option>
                                <option value={5}>5 Massagens</option>
                                <option value={6}>6 Massagens</option>
                                <option value={8}>8 Massagens</option>
                                <option value={10}>10 Massagens</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-dark/30 ml-1">Pagamento</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                className="ios-input w-full h-14"
                            >
                                <option value="pix">PIX</option>
                                <option value="card">Cartão</option>
                                <option value="cash">Dinheiro</option>
                                <option value="unpaid">Ainda não pago</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-xs font-bold uppercase text-dark/30 ml-1">Composição do Pacote</label>
                            <span className={cn(
                                "text-[10px] font-bold uppercase py-1 px-2 rounded-lg",
                                isReady ? "bg-sage/10 text-sage" : "bg-rose/10 text-rose"
                            )}>
                                {currentTotalAllocated} de {packageLimit} selecionadas
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {massages.map(m => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex justify-between items-center",
                                        selectedQuantities[m.id] > 0 ? "bg-sage/10 border-sage" : "bg-cream-light border-transparent"
                                    )}
                                >
                                    <div className="flex-1">
                                        <p className="font-bold text-dark">{m.name}</p>
                                        <p className="text-[10px] font-medium text-dark/40">R$ {m.price - 20} (Unid. com desconto)</p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => updateQuantity(m.id, -1)}
                                            disabled={selectedQuantities[m.id] === 0}
                                            className="w-8 h-8 rounded-full bg-white shadow-ios flex items-center justify-center text-dark/40 disabled:opacity-30 disabled:shadow-none"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-6 text-center font-display font-bold text-lg text-dark">
                                            {selectedQuantities[m.id]}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(m.id, 1)}
                                            disabled={currentTotalAllocated >= packageLimit}
                                            className="w-8 h-8 rounded-full bg-white shadow-ios flex items-center justify-center text-sage disabled:opacity-30 disabled:shadow-none"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center space-x-2">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="bg-sage/5 border-2 border-sage/10 rounded-3xl p-6 flex justify-between items-end">
                        <div>
                            <p className="text-dark/40 font-bold uppercase text-[10px]">Total do Pacote</p>
                            <p className="text-3xl font-display font-bold text-sage">R$ {totalAmount}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-dark/40 font-bold uppercase text-[10px]">Economia</p>
                            <p className="text-lg font-display font-bold text-dark/60">R$ {currentTotalAllocated * 20}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0">
                    <Button
                        className="w-full h-16 text-lg"
                        onClick={handleCreate}
                        loading={loading}
                        disabled={!isReady}
                    >
                        {paymentMethod === 'unpaid' ? 'Criar Pacote' : 'Criar e Marcar como Pago'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
