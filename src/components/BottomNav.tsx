import React from 'react'
import { Calendar, Users, DollarSign, Settings } from 'lucide-react'
import { cn } from '../utils/cn'

interface BottomNavProps {
    activeTab: 'agenda' | 'clients' | 'finance' | 'admin'
    onTabChange: (tab: 'agenda' | 'clients' | 'finance' | 'admin') => void
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'agenda', label: 'Agenda', icon: Calendar },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'finance', label: 'Financeiro', icon: DollarSign },
        { id: 'admin', label: 'Painel', icon: Settings },
    ] as const

    return (
        <nav className="ios-bottom-nav">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={cn(
                        "flex flex-col items-center justify-center transition-all duration-200 w-16 h-full",
                        activeTab === id ? "text-sage" : "text-dark/40"
                    )}
                >
                    <div className={cn(
                        "p-1 rounded-xl transition-colors duration-200",
                        activeTab === id ? "bg-sage/10" : "bg-transparent"
                    )}>
                        <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] font-medium mt-1 uppercase tracking-tight">{label}</span>
                </button>
            ))}
        </nav>
    )
}

export default BottomNav
