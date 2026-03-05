import React, { useState, useEffect } from 'react'
import { Search, UserPlus, Phone, MoreVertical, Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'
import { Button } from '../components/Button'
import { supabase } from '../utils/supabase'
import { Profile } from '../types/database'
import { BottomSheet } from '../components/BottomSheet'
import { AddClientForm } from '../components/AddClientForm'
import { ClientDetails } from '../components/ClientDetails'

export const ClientList: React.FC = () => {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'debtor'>('all')
    const [clients, setClients] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddingClient, setIsAddingClient] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Profile | null>(null)
    const [isViewingDetails, setIsViewingDetails] = useState(false)

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name')

            if (error) throw error
            setClients(data || [])
        } catch (err) {
            console.error('Erro ao buscar clientes:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSuccess = () => {
        setIsAddingClient(false)
        fetchClients()
    }

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
        // For now, filtering is simple. In a real app, 'debtor' and 'active' status would come from business logic or DB fields.
        const matchesFilter = filter === 'all'
        return matchesSearch && matchesFilter
    })

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark">Clientes</h2>
                    <p className="text-dark/40 text-sm font-medium">{loading ? 'Carregando...' : `${clients.length} no total`}</p>
                </div>
                <button
                    onClick={() => setIsAddingClient(true)}
                    className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center text-sage active:scale-95 transition-transform"
                >
                    <UserPlus size={24} />
                </button>
            </header>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        className="ios-input w-full pl-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'active', label: 'Ativas' },
                        { id: 'debtor', label: 'Inadimplentes' },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={cn(
                                "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                                filter === f.id ? "bg-dark text-white shadow-md shadow-dark/20" : "bg-white text-dark/40 border border-cream-dark"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Cards */}
            <div className="space-y-3 pb-24">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4 text-sage opacity-40">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="font-medium">Buscando clientes...</p>
                    </div>
                ) : filteredClients.length > 0 ? filteredClients.map((client) => (
                    <div
                        key={client.id}
                        className="ios-card group active:scale-[0.98] transition-all cursor-pointer"
                        onClick={() => {
                            setSelectedClient(client)
                            setIsViewingDetails(true)
                        }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-rose-light rounded-2xl flex items-center justify-center font-display font-bold text-xl text-rose-dark shadow-inner uppercase">
                                {client.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-dark text-lg leading-none mb-1">{client.name}</h4>
                                    <button className="p-2 -mr-2 text-dark/20 group-hover:text-dark/40 transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center text-xs text-dark/40 font-medium space-x-2">
                                    <Phone size={12} />
                                    <span>{client.phone || 'Sem telefone'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-cream-dark/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-dark/20">Status</span>
                                <span className="text-xs font-bold text-dark/60">Ativa</span>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="ghost" className="h-9 px-4 text-xs bg-sage/5 hover:bg-sage/10">
                                    Ver Perfil
                                </Button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center space-y-4 opacity-40">
                        <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto">
                            <Search size={32} />
                        </div>
                        <p className="font-medium italic">Nenhuma cliente encontrada</p>
                    </div>
                )}
            </div>

            <BottomSheet
                isOpen={isAddingClient}
                onClose={() => setIsAddingClient(false)}
                title="Nova Cliente"
            >
                <AddClientForm
                    onSuccess={handleAddSuccess}
                    onCancel={() => setIsAddingClient(false)}
                />
            </BottomSheet>

            <BottomSheet
                isOpen={isViewingDetails}
                onClose={() => {
                    setIsViewingDetails(false)
                    setSelectedClient(null)
                }}
                title="Perfil da Cliente"
            >
                {selectedClient && (
                    <ClientDetails
                        client={selectedClient}
                        onClose={() => setIsViewingDetails(false)}
                    />
                )}
            </BottomSheet>
        </div>
    )
}
