import React, { useState } from 'react'
import { Info, Bell, Shield, LogOut, ChevronRight, Flower2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { MassageManager } from './MassageManager'

type AdminView = 'main' | 'massages'

export const AdminPanel: React.FC = () => {
    const { signOut, user } = useAuth()
    const [currentView, setCurrentView] = useState<AdminView>('main')

    const handleLogout = async () => {
        if (confirm('Deseja realmente sair?')) {
            await signOut()
        }
    }

    const settingsGroups = [
        {
            title: 'Configurações da Clínica',
            items: [
                { label: 'Gestão de Massagens', icon: Flower2, color: 'text-sage', onClick: () => setCurrentView('massages') },
                { label: 'Horário de Funcionamento', icon: Shield, color: 'text-dark/60', onClick: () => { } },
                { label: 'Notificações Automáticas', icon: Bell, color: 'text-rose', onClick: () => { } },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { label: 'Sobre o App', icon: Info, color: 'text-dark/40', onClick: () => { } },
                { label: 'Sair da Conta', icon: LogOut, color: 'text-red-400', onClick: handleLogout },
            ]
        }
    ]

    if (currentView === 'massages') {
        return <MassageManager onBack={() => setCurrentView('main')} />
    }

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-display font-bold text-dark">Painel Admin</h2>
                <p className="text-dark/40 text-sm font-medium">Configurações e gestão</p>
            </header>

            {/* Profile Header */}
            <div className="ios-card bg-sage text-white border-none mb-8">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-display font-bold text-2xl">
                        L
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Luciana Massage</h3>
                        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Administradora</p>
                    </div>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="space-y-8 pb-24">
                {settingsGroups.map((group, i) => (
                    <div key={i} className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold text-dark/30 ml-2">{group.title}</h4>
                        <div className="ios-card p-0 overflow-hidden divide-y divide-cream-dark/50">
                            {group.items.map((item, j) => (
                                <button
                                    key={j}
                                    onClick={item.onClick}
                                    className="w-full px-5 py-4 flex items-center justify-between active:bg-cream-light transition-colors group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <item.icon className={item.color} size={20} />
                                        <span className="font-bold text-dark">{item.label}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-dark/10 group-active:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="px-4">
                    <p className="text-center text-[10px] text-dark/20 font-bold uppercase tracking-widest">
                        Versão 1.0.0 • Clínica Luciana
                    </p>
                </div>
            </div>
        </div>
    )
}
