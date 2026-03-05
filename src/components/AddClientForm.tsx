import React, { useState } from 'react'
import { User, Phone, Mail, FileText, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { supabase } from '../utils/supabase'

interface AddClientFormProps {
    onSuccess: (client: any) => void
    onCancel: () => void
}

export const AddClientForm: React.FC<AddClientFormProps> = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) {
            setError('O nome é obrigatório.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data, error: dbError } = await supabase
                .from('clients')
                .insert([formData])
                .select()
                .single()

            if (dbError) throw dbError
            onSuccess(data)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao cadastrar cliente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 italic">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                    <input
                        type="text"
                        placeholder="Nome Completo *"
                        className="ios-input w-full pl-12"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                    <input
                        type="tel"
                        placeholder="Telefone (WhatsApp)"
                        className="ios-input w-full pl-12"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                    <input
                        type="email"
                        placeholder="E-mail"
                        className="ios-input w-full pl-12"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="relative">
                    <FileText className="absolute left-4 top-4 text-dark/30" size={20} />
                    <textarea
                        placeholder="Observações (alergias, preferências...)"
                        className="ios-input w-full pl-12 pt-4 h-32 resize-none"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex space-x-3 pt-4">
                <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 h-14"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    className="flex-[2] h-14"
                    loading={loading}
                >
                    Salvar Cliente
                </Button>
            </div>
        </form>
    )
}
