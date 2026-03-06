import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, Loader2, CheckCircle, Clock } from 'lucide-react'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'
import { MarkAsPaidModal } from '../components/MarkAsPaidModal'

export const FinancialDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<any[]>([])
    const [pendingAppointments, setPendingAppointments] = useState<any[]>([])
    const [totals, setTotals] = useState({ received: 0, pending: 0 })
    const [activeView, setActiveView] = useState<'history' | 'pending'>('history')

    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    useEffect(() => {
        fetchFinancialData()
    }, [])

    const fetchFinancialData = async () => {
        setLoading(true)
        try {
            // 1. Fetch History
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select(`
                  *,
                  appointment:appointment_id (
                    client:client_id (name),
                    massage:massage_id (name)
                  )
                `)
                .order('created_at', { ascending: false })

            if (paymentsError) throw paymentsError
            setPayments(paymentsData || [])

            // 2. Fetch Pending Appointments (Completed but no paid record)
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
                  *,
                  client:client_id (name),
                  massage:massage_id (name, price)
                `)
                .lt('start_time', new Date().toISOString())
                .eq('status', 'confirmed')
                .order('start_time', { ascending: false })

            if (appointmentsError) throw appointmentsError

            // Filter out appointments that already have a paid payment record
            const paidAppointmentIds = new Set((paymentsData || []).map(p => p.appointment_id))
            const pending = (appointmentsData || []).filter(apt => !paidAppointmentIds.has(apt.id))

            setPendingAppointments(pending)

            const received = (paymentsData || [])
                .filter(p => p.status === 'paid')
                .reduce((acc, curr) => acc + Number(curr.amount), 0)

            const pendingTotal = pending
                .reduce((acc, curr) => acc + Number(curr.massage?.price || 0), 0)

            setTotals({ received, pending: pendingTotal })
        } catch (err) {
            console.error('Erro ao buscar dados financeiros:', err)
        } finally {
            setLoading(false)
        }
    }

    const stats = [
        { label: 'Recebido (Mês)', value: `R$ ${totals.received}`, icon: TrendingUp, color: 'text-sage' },
        { label: 'A Receber', value: `R$ ${totals.pending}`, icon: Clock, color: 'text-rose' },
        { label: 'Expectativa', value: `R$ ${totals.received + totals.pending}`, icon: DollarSign, color: 'text-dark' },
    ]

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-display font-bold text-dark">Financeiro</h2>
                <p className="text-dark/40 text-sm font-medium">Balanço atualizado</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="ios-card flex items-center justify-between group hover:shadow-ios-hover transition-all">
                        <div className="flex items-center space-x-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-cream-light", stat.color)}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-dark/30 tracking-wider">{stat.label}</span>
                                <h3 className="text-2xl font-display font-bold text-dark">{stat.value}</h3>
                            </div>
                        </div>
                        <ArrowUpRight className="text-dark/5 group-hover:text-dark/20 transition-colors" />
                    </div>
                ))}
            </div>

            {/* View Toggle */}
            <div className="bg-cream-dark/30 p-1 rounded-2xl flex">
                <button
                    onClick={() => setActiveView('history')}
                    className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                        activeView === 'history' ? "bg-white text-sage shadow-ios" : "text-dark/40 hover:text-dark/60"
                    )}
                >
                    Histórico
                </button>
                <button
                    onClick={() => setActiveView('pending')}
                    className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                        activeView === 'pending' ? "bg-rose-light/50 text-rose-dark shadow-ios" : "text-dark/40 hover:text-dark/60"
                    )}
                >
                    A Receber ({pendingAppointments.length})
                </button>
            </div>

            {/* List Section */}
            <div className="space-y-4 pb-24">
                <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg">
                        {activeView === 'history' ? 'Últimos Pagamentos' : 'Clientes a Receber'}
                    </h3>
                    {loading && <Loader2 className="animate-spin text-sage" size={20} />}
                </div>

                {loading && payments.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-dark/20 space-y-4">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="font-medium">Carregando dados...</p>
                    </div>
                ) : activeView === 'history' ? (
                    payments.length > 0 ? payments.map((payment) => (
                        <div key={payment.id} className="ios-card flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                    payment.status === 'paid' ? "bg-sage/10 text-sage" : "bg-rose/10 text-rose"
                                )}>
                                    {payment.status === 'paid' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark">{payment.appointment?.client?.name || 'Cliente'}</h4>
                                    <p className="text-[10px] text-dark/30 font-bold uppercase tracking-tight">
                                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('pt-BR') : 'Pendente'} • {payment.method || 'N/A'} • {payment.appointment?.massage?.name}
                                    </p>
                                </div>
                            </div>
                            <span className="font-display font-bold text-dark text-lg">R$ {payment.amount}</span>
                        </div>
                    )) : (
                        <div className="text-center py-16 bg-white/50 rounded-[32px] border-2 border-dashed border-cream-dark text-dark/20 italic font-medium">
                            Nenhum pagamento registrado
                        </div>
                    )
                ) : (
                    pendingAppointments.length > 0 ? pendingAppointments.map((apt) => (
                        <div key={apt.id} className="ios-card flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-rose/10 text-rose-dark rounded-2xl flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark">{apt.client?.name}</h4>
                                    <p className="text-[10px] text-dark/30 font-bold uppercase tracking-tight">
                                        Realizado em {new Date(apt.start_time).toLocaleDateString('pt-BR')} • {apt.massage?.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedAppointment(apt)
                                    setIsPaymentModalOpen(true)
                                }}
                                className="bg-sage text-white px-4 py-2 rounded-xl text-xs font-bold shadow-ios active:scale-95 transition-all"
                            >
                                Pagar
                            </button>
                        </div>
                    )) : (
                        <div className="text-center py-16 bg-white/50 rounded-[32px] border-2 border-dashed border-cream-dark text-dark/20 italic font-medium">
                            Não há clientes com pagamentos pendentes
                        </div>
                    )
                )}
            </div>

            {selectedAppointment && (
                <MarkAsPaidModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => {
                        setIsPaymentModalOpen(false)
                        setSelectedAppointment(null)
                    }}
                    onSuccess={fetchFinancialData}
                    appointmentId={selectedAppointment.id}
                    amount={Number(selectedAppointment.massage?.price || 0)}
                    clientName={selectedAppointment.client?.name}
                />
            )}
        </div>
    )
}
