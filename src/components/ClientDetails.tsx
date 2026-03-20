import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MessageCircle, ChevronRight, Loader2, Trophy, History, CalendarDays } from 'lucide-react'
import { format, isPast, isFuture, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'
import { Button } from './Button'
import { Profile, Package } from '../types/database'
import { MarkAsPaidModal } from './MarkAsPaidModal'
import { CreatePackageModal } from './CreatePackageModal'
import { Package as PackageIcon, Plus } from 'lucide-react'

interface ClientDetailsProps {
    client: Profile
    onClose: () => void
    onDeleteSuccess?: () => void
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onClose, onDeleteSuccess }) => {
    const [appointments, setAppointments] = useState<any[]>([])
    const [packages, setPackages] = useState<Package[]>([])
    const [paidAptIds, setPaidAptIds] = useState<Set<string>>(new Set())
    const [paidPkgIds, setPaidPkgIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [selectedAptForPayment, setSelectedAptForPayment] = useState<any | null>(null)
    const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false)

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

            // 2. Fetch packages
            const { data: pkgs, error: pkgsError } = await supabase
                .from('packages')
                .select(`
                    *,
                    package_allowed_massages(
                        massage:massage_id (name),
                        quantity_allowed,
                        quantity_used
                    )
                `)
                .eq('client_id', client.id)
                .order('created_at', { ascending: false })

            if (pkgsError) throw pkgsError
            setPackages(pkgs || [])

            // 3. Fetch payments for these appointments and packages
            if (apts && apts.length > 0) {
                const { data: payments, error: paymentsError } = await supabase
                    .from('payments')
                    .select('appointment_id')
                    .in('appointment_id', apts.map(a => a.id))
                    .eq('status', 'paid')

                if (paymentsError) throw paymentsError
                setPaidAptIds(new Set(payments?.map(p => p.appointment_id) || []))
            } else {
                setPaidAptIds(new Set())
            }

            if (pkgs && pkgs.length > 0) {
                const { data: payments, error: paymentsError } = await supabase
                    .from('payments')
                    .select('package_id')
                    .in('package_id', pkgs.map(p => p.id))
                    .eq('status', 'paid')

                if (paymentsError) throw paymentsError
                setPaidPkgIds(new Set(payments?.map(p => p.package_id) || []))
            } else {
                setPaidPkgIds(new Set())
            }
        } catch (err) {
            console.error('Erro ao buscar histórico:', err)
        } finally {
            setLoading(false)
        }
    }

    const confirmedPastApts = appointments.filter(apt => isPast(parseISO(apt.start_time)) && apt.status === 'confirmed')
    const upcomingApts = appointments.filter(apt => isFuture(parseISO(apt.start_time)) && apt.status === 'confirmed')

    // Identify unpaid past appointments (ignoring those that belong to a package) and packages
    const unpaidApts = confirmedPastApts.filter(apt => !apt.package_id && !paidAptIds.has(apt.id))
    const unpaidPkgs = packages.filter(pkg => !paidPkgIds.has(pkg.id) && pkg.status !== 'cancelled')

    const unpaidItems = [
        ...unpaidApts.map(apt => ({ ...apt, is_package: false })),
        ...unpaidPkgs.map(pkg => ({ ...pkg, is_package: true }))
    ].sort((a, b) => new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime())

    const totalDebt = unpaidItems.reduce((sum, item) => sum + (item.is_package ? item.total_amount : item.massage?.price || 0), 0)

    // Calculate total paid (appointments + packages)
    const totalPaidApts = confirmedPastApts.filter(apt => paidAptIds.has(apt.id)).reduce((sum, apt) => sum + (apt.massage?.price || 0), 0)
    const totalPaidPkgs = packages.filter(pkg => paidPkgIds.has(pkg.id)).reduce((sum, pkg) => sum + Number(pkg.total_amount || 0), 0)
    const totalPaid = totalPaidApts + totalPaidPkgs

    const activePackages = packages.filter(pkg => pkg.status === 'active')

    const handleWhatsApp = () => {
        const phone = client.phone?.replace(/\D/g, '')
        if (phone) {
            window.open(`https://wa.me/55${phone}`, '_blank')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir a cliente ${client.name}? Todos os agendamentos e pacotes serão removidios.`)) {
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id)

            if (error) throw error

            onDeleteSuccess?.()
            onClose()
        } catch (err) {
            console.error('Erro ao excluir cliente:', err)
            alert('Erro ao excluir cliente. Tente novamente.')
        } finally {
            setLoading(false)
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
                        {unpaidItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-xs font-medium text-rose-dark/60 bg-white/40 p-2 rounded-lg">
                                <div>
                                    <span className="block font-bold text-rose-dark">
                                        {item.is_package ? `Pacote (${item.total_sessions} sessões)` : item.massage?.name}
                                    </span>
                                    <span className="text-[10px]">
                                        {item.is_package
                                            ? `Criado em ${format(parseISO(item.created_at), "dd/MM")}`
                                            : format(parseISO(item.start_time), "dd/MM")
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="font-bold">R$ {item.is_package ? item.total_amount : item.massage?.price}</span>
                                    <button
                                        onClick={() => setSelectedAptForPayment(item)}
                                        className="bg-rose text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-ios active:scale-95 transition-all"
                                    >
                                        Pagar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-rose-dark/40 uppercase tracking-wider pt-2 border-t border-rose/10">
                        Total de {unpaidItems.length} pendência(s) aguardando pagamento
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

            {/* Packages Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-dark/30 flex items-center">
                        <PackageIcon size={14} className="mr-2" /> Pacotes Ativos
                    </h4>
                    <button
                        onClick={() => setIsCreatePackageOpen(true)}
                        className="text-[10px] font-bold text-sage uppercase flex items-center bg-sage/10 px-2 py-1 rounded-lg"
                    >
                        <Plus size={12} className="mr-1" /> Novo Pacote
                    </button>
                </div>

                {activePackages.length > 0 ? (
                    <div className="space-y-2">
                        {activePackages.map(pkg => (
                            <div key={pkg.id} className="ios-card bg-cream-light/50 border-sage/20 !p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-dark leading-tight">
                                            {(pkg as any).package_allowed_massages?.map((am: any) => am.massage?.name).join(', ')}
                                        </p>
                                        <p className="text-[10px] font-medium text-dark/40 uppercase mt-1">Pacote de {pkg.total_sessions} sessões</p>
                                    </div>
                                    <div className="bg-sage text-white px-2 py-1 rounded-lg text-[10px] font-bold shrink-0">
                                        ATIVO
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-dark/30 mb-1">
                                        <span>Detalhamento do Pacote</span>
                                        <span className="text-sage">{pkg.remaining_sessions} / {pkg.total_sessions} total</span>
                                    </div>
                                    <div className="space-y-2">
                                        {(pkg as any).package_allowed_massages?.map((am: any) => (
                                            <div key={am.massage?.name} className="flex items-center justify-between text-[11px] font-medium text-dark/60 bg-white/50 p-2 rounded-xl">
                                                <span>{am.massage?.name}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-sage"
                                                            style={{ width: `${((am.quantity_used || 0) / (am.quantity_allowed || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-bold">{(am.quantity_allowed || 0) - (am.quantity_used || 0)} restantes</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-2 bg-cream-dark rounded-full overflow-hidden mt-4">
                                        <div
                                            className="h-full bg-sage transition-all duration-500"
                                            style={{ width: `${(pkg.remaining_sessions / pkg.total_sessions) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        onClick={() => setIsCreatePackageOpen(true)}
                        className="p-6 border-2 border-dashed border-cream-dark rounded-ios-lg text-center opacity-40 hover:opacity-100 transition-all cursor-pointer bg-cream-light/30"
                    >
                        <p className="text-xs font-medium italic">Nenhum pacote ativo. Clique para criar.</p>
                    </div>
                )}
            </div>
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
                                        (paidAptIds.has(apt.id) || apt.package_id) ? "opacity-60 bg-white" : "border-rose/30 bg-rose/5"
                                    )}>
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                (paidAptIds.has(apt.id) || apt.package_id) ? "bg-cream-dark/50 text-dark/30" : "bg-rose/10 text-rose"
                                            )}>
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-sm font-bold",
                                                    (paidAptIds.has(apt.id) || apt.package_id) ? "text-dark/60" : "text-dark"
                                                )}>{apt.massage?.name}</p>
                                                <p className="text-[10px] font-medium text-dark/30">
                                                    {format(parseISO(apt.start_time), "dd/MM/yyyy", { locale: ptBR })} • R$ {apt.massage?.price}
                                                </p>
                                            </div>
                                        </div>
                                        {(paidAptIds.has(apt.id) || apt.package_id) ? (
                                            <span className="text-[10px] font-bold text-sage">
                                                {apt.package_id ? 'Pacote' : 'Pago'}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedAptForPayment(apt)}
                                                className="bg-rose text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-ios active:scale-95 transition-all"
                                            >
                                                Pagar
                                            </button>
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

            {selectedAptForPayment && (
                <MarkAsPaidModal
                    isOpen={!!selectedAptForPayment}
                    onClose={() => setSelectedAptForPayment(null)}
                    onSuccess={fetchHistory}
                    appointmentId={selectedAptForPayment.is_package ? undefined : selectedAptForPayment.id}
                    packageId={selectedAptForPayment.is_package ? selectedAptForPayment.id : undefined}
                    amount={Number(selectedAptForPayment.is_package ? selectedAptForPayment.total_amount : selectedAptForPayment.massage?.price || 0)}
                    clientName={client.name}
                />
            )}
            {isCreatePackageOpen && (
                <CreatePackageModal
                    isOpen={isCreatePackageOpen}
                    onClose={() => setIsCreatePackageOpen(false)}
                    onSuccess={fetchHistory}
                    client={client}
                />
            )}

            <div className="pt-6 border-t border-cream-dark/50">
                <Button
                    variant="ghost"
                    className="w-full text-rose hover:bg-rose/5"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    Excluir Cliente
                </Button>
            </div>
        </div>
    )
}
