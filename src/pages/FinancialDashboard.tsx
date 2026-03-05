import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, Loader2, CheckCircle, Clock } from 'lucide-react'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'

export const FinancialDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<any[]>([])
    const [totals, setTotals] = useState({ received: 0, pending: 0 })

    useEffect(() => {
        fetchFinancialData()
    }, [])

    const fetchFinancialData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
          *,
          appointment:appointment_id (
            client:client_id (name)
          )
        `)
                .order('created_at', { ascending: false })

            if (error) throw error

            const paymentsList = data || []
            setPayments(paymentsList)

            const received = paymentsList
                .filter(p => p.status === 'paid')
                .reduce((acc, curr) => acc + Number(curr.amount), 0)

            const pending = paymentsList
                .filter(p => p.status === 'pending')
                .reduce((acc, curr) => acc + Number(curr.amount), 0)

            setTotals({ received, pending })
        } catch (err) {
            console.error('Erro ao buscar dados financeiros:', err)
        } finally {
            setLoading(false)
        }
    }

    const stats = [
        { label: 'Recebido (Mês)', value: `R$ ${totals.received}`, icon: TrendingUp, color: 'text-sage' },
        { label: 'Pendente', value: `R$ ${totals.pending}`, icon: TrendingDown, color: 'text-rose' },
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
                    <div key={i} className="ios-card flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-cream-light", stat.color)}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-dark/30">{stat.label}</span>
                                <h3 className="text-2xl font-display font-bold text-dark">{stat.value}</h3>
                            </div>
                        </div>
                        <ArrowUpRight className="text-dark/10" />
                    </div>
                ))}
            </div>

            {/* Chart Placeholder */}
            <div className="ios-card">
                <h3 className="font-display font-bold text-lg mb-4">Receita Semanal</h3>
                <div className="h-40 w-full flex items-end justify-between px-2">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <div key={i} className="flex flex-col items-center space-y-2 group">
                            <div
                                className="w-8 bg-sage/20 rounded-t-lg group-hover:bg-sage transition-all duration-300 relative"
                                style={{ height: `${h}%` }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-sage opacity-0 group-hover:opacity-100">
                                    R${h * 10}
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-dark/20">D{i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4 pb-24">
                <h3 className="font-display font-bold text-lg">Últimos Pagamentos</h3>
                {loading ? (
                    <div className="py-10 flex justify-center">
                        <Loader2 className="animate-spin text-sage" size={24} />
                    </div>
                ) : payments.length > 0 ? payments.map((payment) => (
                    <div key={payment.id} className="ios-card flex items-center justify-between active:scale-[0.98] transition-all">
                        <div className="flex items-center space-x-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                payment.status === 'paid' ? "bg-sage/10 text-sage" : "bg-rose/10 text-rose"
                            )}>
                                {payment.status === 'paid' ? <CheckCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-dark">{payment.appointment?.client?.name || 'Cliente'}</h4>
                                <p className="text-[10px] text-dark/30 font-bold uppercase">
                                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'Pendente'} • {payment.method || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <span className="font-display font-bold text-dark">R$ {payment.amount}</span>
                    </div>
                )) : (
                    <div className="text-center py-10 text-dark/20 italic font-medium">Nenhum pagamento registrado</div>
                )}
            </div>
        </div>
    )
}
