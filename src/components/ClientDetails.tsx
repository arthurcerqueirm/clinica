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
    const [paidAptIds, setPaidAptIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [client.id])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            // 1. Fetch appointments
            const { data: apts, error: aptsError } = await supabase
                .from('appointments')
                .select(`
          *,
          massage:massage_id (name, price, duration_minutes)
        `)
                .eq('client_id', client.id)
                .order('start_time', { ascending: false })

            if (aptsError) throw aptsError
            setAppointments(apts || [])

            // 2. Fetch payments for these appointments
            if (apts && apts.length > 0) {
                const { data: payments, error: paymentsError } = await supabase
                    .from('payments')
                    .select('appointment_id')
                    .in('appointment_id', apts.map(a => a.id))
                    .eq('status', 'paid')

                if (paymentsError) throw paymentsError
                setPaidAptIds(new Set(payments?.map(p => p.appointment_id) || []))
            }
        } catch (err) {
            console.error('Erro ao buscar histórico:', err)
        } finally {
            setLoading(false)
        }
    }

    const confirmedPastApts = appointments.filter(apt => isPast(parseISO(apt.start_time)) && apt.status === 'confirmed')
    const upcomingApts = appointments.filter(apt => isFuture(parseISO(apt.start_time)) && apt.status === 'confirmed')

    // Identify unpaid past appointments
    const unpaidApts = confirmedPastApts.filter(apt => !paidAptIds.has(apt.id))
    const totalDebt = unpaidApts.reduce((sum, apt) => sum + (apt.massage?.price || 0), 0)
    const totalPaid = confirmedPastApts.filter(apt => paidAptIds.has(apt.id)).reduce((sum, apt) => sum + (apt.massage?.price || 0), 0)

    const handleWhatsApp = () => {
        const phone = client.phone?.replace(/\D/g, '')
        if (phone) {
            window.open(`https://wa.me/55${phone}`, '_blank')
        }
    }

    return (
        <div className="space-y-6 pb-6">
            {/* Debt Warning Alert */}
            {totalDebt > 0 && (
                <div className="ios-card bg-rose/10 border-rose/20 p-5 space-y-3 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-rose-dark">
                            <History size={20} />
                            <h4 className="font-bold text-lg">Pagamentos Pendentes</h4>
                        </div>
                        <span className="text-xl font-display font-bold text-rose-dark">R$ {totalDebt}</span>
                    </div>
                    <div className="space-y-2">
                        {unpaidApts.map(apt => (
                            <div key={apt.id} className="flex items-center justify-between text-xs font-medium text-rose-dark/60">
                                <span>{apt.massage?.name} ({format(parseISO(apt.start_time), "dd/MM")})</span>
                                <span className="font-bold">R$ {apt.massage?.price}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-rose-dark/40 uppercase tracking-wider pt-2 border-t border-rose/10">
                        Total de {unpaidApts.length} sessões aguardando pagamento
                    </p>
                </div>
            )}

            {/* Header Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="ios-card bg-sage/5 border-sage/10 p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center text-sage mb-2">
                        <Trophy size={20} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-dark/30">Total Realizado</span>
                    <span className="text-xl font-display font-bold text-sage">{confirmedPastApts.length}</span>
                </div>
                <div className="ios-card bg-rose/5 border-rose/10 p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center text-rose mb-2">
                        <History size={20} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-dark/30">Valor Pago</span>
                    <span className="text-xl font-display font-bold text-rose-dark">R$ {totalPaid}</span>
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

                <div className="pt-2 flex flex-col space-y-2">
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
                        {confirmedPastApts.length > 0 ? (
                            <div className="space-y-2">
                                {confirmedPastApts.map(apt => (
                                    <div key={apt.id} className={cn(
                                        "ios-card !p-3 flex items-center justify-between transition-all",
                                        paidAptIds.has(apt.id) ? "opacity-60 bg-white" : "border-rose/30 bg-rose/5"
                                    )}>
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                paidAptIds.has(apt.id) ? "bg-cream-dark/50 text-dark/30" : "bg-rose/10 text-rose"
                                            )}>
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-sm font-bold",
                                                    paidAptIds.has(apt.id) ? "text-dark/60" : "text-dark"
                                                )}>{apt.massage?.name}</p>
                                                <p className="text-[10px] font-medium text-dark/30">
                                                    {format(parseISO(apt.start_time), "dd/MM/yyyy", { locale: ptBR })} • R$ {apt.massage?.price}
                                                </p>
                                            </div>
                                        </div>
                                        {paidAptIds.has(apt.id) ? (
                                            <span className="text-[10px] font-bold text-sage">Pago</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-rose animate-pulse">Pendente</span>
                                        )}
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
