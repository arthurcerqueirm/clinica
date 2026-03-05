import React, { useState, useEffect } from 'react'
import { Plus, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Trash2, CalendarDays, RefreshCw } from 'lucide-react'
import {
    format,
    addDays,
    addWeeks,
    subDays,
    subWeeks,
    isSameDay,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isToday,
    setHours,
    setMinutes,
    isWithinInterval,
    addMinutes
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../utils/cn'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/BottomSheet'
import { SchedulingFlow } from '../components/SchedulingFlow'
import { supabase } from '../utils/supabase'

// Business Hours: 08:00 to 20:00
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i)
const DAYS_TO_SHOW = [1, 2, 3, 4, 5, 6] // Monday (1) to Saturday (6)

export const CalendarView: React.FC = () => {
    const [viewDate, setViewDate] = useState(new Date())
    const [isScheduling, setIsScheduling] = useState(false)
    const [isManaging, setIsManaging] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAppointments()
    }, [viewDate])

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const start = startOfWeek(viewDate, { locale: ptBR })
            const end = endOfWeek(viewDate, { locale: ptBR })

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          client:client_id (name, phone),
          massage:massage_id (name, duration_minutes, price)
        `)
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString())
                .order('start_time')

            if (error) throw error
            setAppointments(data || [])
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err)
        } finally {
            setLoading(false)
        }
    }

    const navigate = (direction: 'prev' | 'next') => {
        setViewDate(direction === 'next' ? addWeeks(viewDate, 1) : subWeeks(viewDate, 1))
    }

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return
        if (!confirm('Tem certeza que deseja desmarcar este agendamento?')) return

        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', selectedAppointment.id)

            if (error) throw error
            setIsManaging(false)
            fetchAppointments()
        } catch (err) {
            alert('Erro ao desmarcar agendamento.')
        }
    }

    const weekStart = startOfWeek(viewDate, { locale: ptBR })
    const days = eachDayOfInterval({
        start: addDays(weekStart, 1), // Start Monday
        end: addDays(weekStart, 6)   // End Saturday
    })

    const getAppointmentForSlot = (day: Date, hour: number) => {
        const slotTime = setMinutes(setHours(day, hour), 0)
        return appointments.find(apt => {
            const aptStart = new Date(apt.start_time)
            const aptEnd = new Date(apt.end_time)
            return isWithinInterval(slotTime, { start: aptStart, end: addMinutes(aptEnd, -1) })
        })
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark">Agenda</h2>
                    <div className="flex items-center space-x-2 text-sage font-bold">
                        <span>{format(viewDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate('prev')}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setViewDate(new Date())}
                        className="px-4 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-xs font-bold text-sage active:scale-95 transition-transform"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => navigate('next')}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {/* Agenda Grid */}
            <div className="bg-white rounded-ios-lg shadow-ios overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                        <Loader2 className="animate-spin text-sage" size={32} />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed min-w-[600px]">
                        <thead>
                            <tr className="bg-cream-light/50 border-b border-cream-dark/50">
                                <th className="w-16 py-3"></th>
                                {days.map((day) => (
                                    <th key={day.toString()} className="py-3 px-1 text-center">
                                        <div className={cn(
                                            "flex flex-col items-center py-1 rounded-xl",
                                            isToday(day) ? "bg-sage/10 text-sage" : "text-dark/40"
                                        )}>
                                            <span className="text-[10px] font-bold uppercase">{format(day, 'eee', { locale: ptBR })}</span>
                                            <span className="text-lg font-display font-bold">{format(day, 'd')}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {HOURS.map((hour) => (
                                <tr key={hour} className="border-b border-cream-dark/20 last:border-0 h-16">
                                    <td className="text-center">
                                        <span className="text-xs font-bold text-dark/20">{hour}:00</span>
                                    </td>
                                    {days.map((day) => {
                                        const apt = getAppointmentForSlot(day, hour)
                                        const isSlotStart = apt && isSameDay(new Date(apt.start_time), day) && new Date(apt.start_time).getHours() === hour

                                        return (
                                            <td
                                                key={`${day}-${hour}`}
                                                className="relative p-1 border-r border-cream-dark/10 last:border-0 h-full"
                                                onClick={() => {
                                                    if (apt) {
                                                        setSelectedAppointment(apt)
                                                        setIsManaging(true)
                                                    } else {
                                                        setSelectedSlot(setMinutes(setHours(day, hour), 0))
                                                        setIsScheduling(true)
                                                    }
                                                }}
                                            >
                                                {apt ? (
                                                    isSlotStart && (
                                                        <div className="absolute inset-x-1 top-1 bottom-1 bg-sage/20 border-l-4 border-l-sage rounded-xl p-2 z-10 animate-in fade-in zoom-in-95 overflow-hidden">
                                                            <h4 className="text-[10px] font-bold text-sage-dark truncate">{apt.client?.name}</h4>
                                                            <p className="text-[9px] text-sage/80 font-medium truncate">{apt.massage?.name}</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="h-full w-full rounded-xl hover:bg-cream-light/50 transition-colors flex items-center justify-center group">
                                                        <Plus size={14} className="text-dark/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Action Button (New Quick Record) */}
            <button
                onClick={() => {
                    setSelectedSlot(null)
                    setIsScheduling(true)
                }}
                className="fixed bottom-24 right-6 w-16 h-16 bg-sage text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
            >
                <Plus size={32} />
            </button>

            {/* Scheduling Flow Sheet */}
            <BottomSheet
                isOpen={isScheduling}
                onClose={() => {
                    setIsScheduling(false)
                    setSelectedSlot(null)
                }}
                title={selectedSlot ? `Agendamento para ${format(selectedSlot, "eeee, HH:mm", { locale: ptBR })}` : "Novo Agendamento"}
            >
                <SchedulingFlow
                    preSelectedDate={selectedSlot}
                    onComplete={() => {
                        setIsScheduling(false)
                        setSelectedSlot(null)
                        fetchAppointments()
                    }}
                />
            </BottomSheet>

            {/* Management Sheet */}
            <BottomSheet
                isOpen={isManaging}
                onClose={() => {
                    setIsManaging(false)
                    setSelectedAppointment(null)
                }}
                title="Detalhes do Agendamento"
            >
                {selectedAppointment && (
                    <div className="space-y-6">
                        <div className="ios-card bg-cream-light border-2 border-sage/20 space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-sage text-white rounded-2xl flex items-center justify-center font-display font-bold text-2xl uppercase">
                                    {selectedAppointment.client?.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-dark">{selectedAppointment.client?.name}</h3>
                                    <p className="text-sm font-medium text-dark/40">{selectedAppointment.client?.phone}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-dark/20 flex items-center">
                                        <Clock size={10} className="mr-1" /> Horário
                                    </span>
                                    <p className="font-bold text-dark">
                                        {format(new Date(selectedAppointment.start_time), "HH:mm")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-dark/20 flex items-center">
                                        <User size={10} className="mr-1" /> Massagem
                                    </span>
                                    <p className="font-bold text-dark truncate">
                                        {selectedAppointment.massage?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button variant="secondary" className="h-14 space-x-2 opacity-50 cursor-not-allowed">
                                <RefreshCw size={20} />
                                <span>Reagendar (Em breve)</span>
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-14 text-rose-dark hover:bg-rose/10 space-x-2"
                                onClick={handleDeleteAppointment}
                            >
                                <Trash2 size={20} />
                                <span>Desmarcar Massagem</span>
                            </Button>
                        </div>

                        <p className="text-center text-[10px] uppercase font-bold text-dark/20 italic">
                            ID: {selectedAppointment.id.split('-')[0]}..
                        </p>
                    </div>
                )}
            </BottomSheet>
        </div>
    )
}
