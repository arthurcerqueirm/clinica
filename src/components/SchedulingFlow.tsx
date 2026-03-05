import React, { useState, useEffect } from 'react'
import { Search, UserPlus, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { createGoogleCalendarEvent, CalendarEvent } from '../utils/googleCalendar'
import { Massage, Profile } from '../types/database'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BottomSheet } from './BottomSheet'
import { AddClientForm } from './AddClientForm'

interface SchedulingFlowProps {
    onComplete: () => void
    preSelectedDate?: Date
}

const steps = ['Cliente', 'Massagem', 'Confirmar']

export const SchedulingFlow: React.FC<SchedulingFlowProps> = ({ onComplete, preSelectedDate }) => {
    const { session } = useAuth()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [clients, setClients] = useState<Profile[]>([])
    const [massages, setMassages] = useState<Massage[]>([])

    const [selectedClient, setSelectedClient] = useState<Profile | null>(null)
    const [selectedMassage, setSelectedMassage] = useState<Massage | null>(null)
    const [search, setSearch] = useState('')
    const [isAddingClient, setIsAddingClient] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const [{ data: clientsData }, { data: massagesData }] = await Promise.all([
                supabase.from('clients').select('*').order('name'),
                supabase.from('massages').select('*').eq('is_active', true).order('price')
            ])

            setClients(clientsData || [])
            setMassages(massagesData || [])
        } catch (err) {
            setError('Erro ao carregar dados. Verifique sua conexão.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddClientSuccess = (newClient: Profile) => {
        setClients([newClient, ...clients])
        setSelectedClient(newClient)
        setIsAddingClient(false)
        setStep(1)
    }

    const handleConfirm = async () => {
        if (!selectedClient || !selectedMassage) return

        setLoading(true)
        setError(null)

        try {
            const startTime = preSelectedDate || new Date()
            const endTime = addMinutes(startTime, selectedMassage.duration_minutes)

            console.log('Agendando para:', format(startTime, 'yyyy-MM-dd HH:mm'))

            // 1. Save to Supabase
            const { data: appointment, error: dbError } = await supabase
                .from('appointments')
                .insert({
                    client_id: selectedClient.id,
                    massage_id: selectedMassage.id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'confirmed'
                })
                .select()
                .single()

            if (dbError) throw dbError

            // 2. Sync with Google Calendar
            try {
                const googleEvent: CalendarEvent = {
                    summary: `Massagem: ${selectedMassage.name} - ${selectedClient.name}`,
                    description: `Agendamento via Clinica Luciana\nMassagem: ${selectedMassage.name}\nCliente: ${selectedClient.name}`,
                    start: {
                        dateTime: startTime.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    end: {
                        dateTime: endTime.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                }

                const syncResult = await createGoogleCalendarEvent(session, googleEvent)

                if (syncResult?.id) {
                    await supabase
                        .from('appointments')
                        .update({ google_event_id: syncResult.id })
                        .eq('id', appointment.id)
                }
            } catch (googleErr) {
                console.error('Falha na sincronização com Google Calendar:', googleErr)
                // We don't throw here to avoid blocking the app flow if only Google fails
            }

            onComplete()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao realizar o agendamento.')
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="flex justify-between items-center mb-8 px-2">
                {steps.map((s, i) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300",
                                step >= i ? "bg-sage text-white" : "bg-cream-dark text-dark/30"
                            )}>
                                {step > i ? <CheckCircle2 size={16} /> : i + 1}
                            </div>
                            <span className={cn(
                                "text-[10px] mt-1 font-bold uppercase tracking-wider",
                                step >= i ? "text-sage" : "text-dark/20"
                            )}>{s}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={cn("h-[2px] flex-1 mx-2 mt-[-16px]", step > i ? "bg-sage" : "bg-cream-dark")} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-ios-lg flex items-center space-x-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Step Content */}
            <div className="min-h-[300px]">
                {loading && step === 0 ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-sage" size={32} />
                    </div>
                ) : (
                    <>
                        {step === 0 && (
                            <div className="space-y-4 fade-in">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        className="ios-input w-full pl-12"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {filteredClients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => { setSelectedClient(client); setStep(1); }}
                                            className={cn(
                                                "w-full p-4 flex items-center justify-between rounded-2xl transition-all",
                                                selectedClient?.id === client.id ? "bg-sage/10 border-sage" : "bg-cream-light hover:bg-cream-dark/30"
                                            )}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-rose-light rounded-full flex items-center justify-center font-bold text-rose-dark uppercase">
                                                    {client.name[0]}
                                                </div>
                                                <span className="font-semibold text-dark text-left">{client.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <div className="text-center py-4 text-dark/20 italic font-medium">Nenhum cliente encontrado</div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full text-sage border-2 border-sage border-dashed h-14"
                                    onClick={() => setIsAddingClient(true)}
                                >
                                    <UserPlus size={20} className="mr-2" /> Nova Cliente
                                </Button>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid grid-cols-1 gap-4 fade-in">
                                {massages.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => { setSelectedMassage(m); setStep(2); }}
                                        className={cn(
                                            "p-5 rounded-ios-lg text-left transition-all border-2",
                                            selectedMassage?.id === m.id ? "bg-sage/10 border-sage" : "bg-cream-light border-transparent"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-dark">{m.name}</h4>
                                            <span className="font-display font-bold text-sage">R$ {m.price}</span>
                                        </div>
                                        <p className="text-sm text-dark/40 font-medium">Duração: {m.duration_minutes} min</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 fade-in">
                                <div className="bg-cream-light p-6 rounded-ios-lg border-2 border-sage/20 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-dark/40 font-bold uppercase text-[10px]">Cliente</span>
                                        <span className="font-bold text-dark">{selectedClient?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark/40 font-bold uppercase text-[10px]">Massagem</span>
                                        <span className="font-bold text-dark">{selectedMassage?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark/40 font-bold uppercase text-[10px]">Horário</span>
                                        <span className="font-bold text-dark">
                                            {format(preSelectedDate || new Date(), "eeee, HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-cream-dark flex justify-between items-center">
                                        <span className="font-display font-bold text-xl">Total</span>
                                        <span className="text-2xl font-display font-bold text-sage">R$ {selectedMassage?.price}</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-16 text-lg"
                                    onClick={handleConfirm}
                                    loading={loading}
                                >
                                    Confirmar Agendamento
                                </Button>
                                <p className="text-center text-[10px] uppercase font-bold text-dark/20 px-8">
                                    O agendamento será sincronizado com seu Google Calendar
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <BottomSheet
                isOpen={isAddingClient}
                onClose={() => setIsAddingClient(false)}
                title="Nova Cliente"
            >
                <AddClientForm
                    onSuccess={handleAddClientSuccess}
                    onCancel={() => setIsAddingClient(false)}
                />
            </BottomSheet>
        </div>
    )
}
