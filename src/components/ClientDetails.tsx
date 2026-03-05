import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MessageCircle, ChevronRight, Loader2, Trophy, History, CalendarDays } from 'lucide-react'
import { format, isPast, isFuture, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'
import { Button } from './Button'
import { Profile } from '../types/database'

interface ClientDetailsProps {
    client: Profile
    onClose: () => void
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onClose }) => {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [client.id])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          massage:massage_id (name, price, duration_minutes)
        `)
                .eq('client_id', client.id)
                .order('start_time', { ascending: false })

            if (error) throw error
            setAppointments(data || [])
        } catch (err) {
            console.error('Erro ao buscar histórico:', err)
        } finally {
            setLoading(false)
        }
    }

    const pastApts = appointments.filter(apt => isPast(parseISO(apt.start_time)) && apt.status === 'confirmed')
    const upcomingApts = appointments.filter(apt => isFuture(parseISO(apt.start_time)) && apt.status === 'confirmed')

    const totalSpent = pastApts.reduce((sum, apt) => sum + (apt.massage?.price || 0), 0)

    const handleWhatsApp = () => {
        const phone = client.phone?.replace(/\D/g, '')
        if (phone) {
            window.open(`https://wa.me/55${phone}`, '_blank')
        }
    }

    return (
        <div className="space-y-6 pb-6">
            {/* Header Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="ios-card bg-sage/5 border-sage/10 p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center text-sage mb-2">
                        <Trophy size={20} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-dark/30">Total Realizado</span>
                    <span className="text-xl font-display font-bold text-sage">{pastApts.length}</span>
                </div>
                <div className="ios-card bg-rose/5 border-rose/10 p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center text-rose mb-2">
                        <History size={20} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-dark/30">Investimento</span>
                    <span className="text-xl font-display font-bold text-rose-dark">R$ {totalSpent}</span>
                </div>
            </div>

            {/* Info Card */}
            <div className="ios-card space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-cream-dark rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-dark/40 uppercase shadow-inner">
                        {client.name[0]}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-dark">{client.name}</h3>
                        <p className="text-sm font-medium text-dark/40">{client.phone || 'Sem telefone'}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        variant="secondary"
                        className="w-full h-12 space-x-2 bg-sage/10 text-sage hover:bg-sage/20 border-0"
                        onClick={handleWhatsApp}
                    >
                        <MessageCircle size={20} />
                        <span>Enviar Mensagem</span>
                    </Button>
                </div>
            </div>

            {/* History Sections */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-40">
                    <Loader2 className="animate-spin text-sage" size={32} />
                    <p className="font-medium text-sm">Carregando histórico...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Upcoming */}
                    {upcomingApts.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-dark/30 flex items-center">
                                <CalendarDays size={14} className="mr-2" /> Próximas Massagens
                            </h4>
                            <div className="space-y-2">
                                {upcomingApts.map(apt => (
                                    <div key={apt.id} className="ios-card !p-3 flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center text-sage">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-dark">{apt.massage?.name}</p>
                                                <p className="text-[10px] font-medium text-dark/40">
                                                    {format(parseISO(apt.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-dark/20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark/30 flex items-center">
                            <History size={14} className="mr-2" /> Histórico de Sessões
                        </h4>
                        {pastApts.length > 0 ? (
                            <div className="space-y-2">
                                {pastApts.map(apt => (
                                    <div key={apt.id} className="ios-card !p-3 flex items-center justify-between opacity-80">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-cream-dark/50 rounded-xl flex items-center justify-center text-dark/30">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-dark/60">{apt.massage?.name}</p>
                                                <p className="text-[10px] font-medium text-dark/30">
                                                    {format(parseISO(apt.start_time), "dd/MM/yyyy", { locale: ptBR })} • R$ {apt.massage?.price}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-sage">Concluída</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-cream-dark rounded-ios-lg text-center opacity-40">
                                <p className="text-xs font-medium italic">Nenhuma sessão anterior encontrada</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
