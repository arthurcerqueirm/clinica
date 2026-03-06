import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ChevronLeft, Loader2, Save, X, Clock, DollarSign } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { Button } from '../components/Button'
import { cn } from '../utils/cn'
import { Massage } from '../types/database'

interface MassageManagerProps {
    onBack: () => void
}

export const MassageManager: React.FC<MassageManagerProps> = ({ onBack }) => {
    const [massages, setMassages] = useState<Massage[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Omit<Massage, 'id' | 'is_active' | 'image_url'>>({
        name: '',
        description: '',
        duration_minutes: 60,
        price: 150
    })

    useEffect(() => {
        fetchMassages()
    }, [])

    const fetchMassages = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('massages')
                .select('*')
                .eq('is_active', true)
                .order('created_at')
            if (error) throw error
            setMassages(data || [])
        } catch (err) {
            console.error('Erro ao buscar massagens:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (id?: string) => {
        setLoading(true)
        try {
            if (id) {
                const { error } = await supabase
                    .from('massages')
                    .update(formData)
                    .eq('id', id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('massages')
                    .insert([formData])
                if (error) throw error
            }
            setIsAdding(false)
            setEditingId(null)
            setFormData({ name: '', description: '', duration_minutes: 60, price: 150 })
            fetchMassages()
        } catch (err) {
            alert('Erro ao salvar massagem.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta massagem?')) return
        setLoading(true)
        try {
            // Soft delete using is_active
            const { error } = await supabase
                .from('massages')
                .update({ is_active: false })
                .eq('id', id)
            if (error) throw error
            fetchMassages()
        } catch (err) {
            alert('Erro ao excluir massagem.')
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (m: Massage) => {
        setEditingId(m.id)
        setFormData({
            name: m.name,
            description: m.description || '',
            duration_minutes: m.duration_minutes,
            price: Number(m.price)
        })
        setIsAdding(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <header className="flex items-center space-x-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark">Serviços</h2>
                    <p className="text-dark/40 text-sm font-medium">Gestão de massagens e preços</p>
                </div>
            </header>

            {!isAdding && !editingId && (
                <Button
                    className="w-full h-14 space-x-2"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus size={20} />
                    <span>Adicionar Novo Serviço</span>
                </Button>
            )}

            {(isAdding || editingId) && (
                <div className="ios-card space-y-4 border-2 border-sage/20 bg-white animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-bold text-lg text-sage-dark">
                            {isAdding ? 'Novo Serviço' : 'Editar Serviço'}
                        </h3>
                        <button
                            onClick={() => { setIsAdding(false); setEditingId(null); }}
                            className="text-dark/20 hover:text-dark transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-dark/30 ml-1">Nome da Massagem</label>
                            <input
                                type="text"
                                className="ios-input w-full"
                                placeholder="Ex: Massagem Relaxante"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-dark/30 ml-1">Preço (R$)</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/20" />
                                    <input
                                        type="number"
                                        className="ios-input w-full pl-10"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-dark/30 ml-1">Duração (min)</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/20" />
                                    <input
                                        type="number"
                                        className="ios-input w-full pl-10"
                                        value={formData.duration_minutes}
                                        onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-dark/30 ml-1">Descrição (opcional)</label>
                            <textarea
                                className="ios-input w-full py-3 h-20 resize-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            onClick={() => { setIsAdding(false); setEditingId(null); }}
                            className="h-14 font-bold text-dark/30 uppercase text-xs tracking-widest"
                        >
                            Cancelar
                        </button>
                        <Button
                            className="h-14"
                            onClick={() => handleSave(editingId || undefined)}
                            loading={loading}
                        >
                            <Save size={18} className="mr-2" />
                            Salvar
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-4 pb-24">
                <h3 className="font-display font-bold text-lg text-dark/40">Massagens Ativas</h3>
                {loading && massages.length === 0 ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-sage" size={32} />
                    </div>
                ) : massages.length > 0 ? (
                    <div className="space-y-3">
                        {massages.map((m) => (
                            <div key={m.id} className="ios-card group hover:shadow-ios-hover transition-all border-cream-dark/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-bold text-dark text-lg">{m.name}</h4>
                                            <span className="text-[10px] bg-sage/10 text-sage px-2 py-0.5 rounded-full font-bold">Ativo</span>
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <div className="flex items-center text-dark/40 text-xs font-bold">
                                                <Clock size={12} className="mr-1" />
                                                {m.duration_minutes} min
                                            </div>
                                            <div className="flex items-center text-sage font-bold text-xs uppercase tracking-wider">
                                                <DollarSign size={12} className="mr-0.5" />
                                                R$ {m.price}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(m)}
                                            className="w-10 h-10 bg-cream-light text-sage rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className="w-10 h-10 bg-rose-light/50 text-rose-dark rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-cream-dark text-dark/20 italic font-medium">
                        Nenhum serviço cadastrado
                    </div>
                )}
            </div>
        </div>
    )
}
