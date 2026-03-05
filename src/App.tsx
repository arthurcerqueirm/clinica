import React, { useState } from 'react'
import BottomNav from './components/BottomNav'
import { CalendarView } from './pages/CalendarView'
import { ClientList } from './pages/ClientList'
import { FinancialDashboard } from './pages/FinancialDashboard'
import { AdminPanel } from './pages/AdminPanel'
import { useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import { Flower2 } from 'lucide-react'

type Tab = 'agenda' | 'clients' | 'finance' | 'admin'

function App() {
    const { user, loading } = useAuth()
    const [activeTab, setActiveTab] = useState<Tab>('agenda')

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-light flex items-center justify-center">
                <div className="animate-bounce text-sage">
                    <Flower2 size={40} />
                </div>
            </div>
        )
    }

    if (!user) {
        return <Login />
    }

    return (
        <div className="min-h-screen bg-cream-light pb-24 px-4 pt-6">
            <main className="max-w-md mx-auto">
                {activeTab === 'agenda' && <CalendarView />}
                {activeTab === 'clients' && <ClientList />}
                {activeTab === 'finance' && <FinancialDashboard />}
                {activeTab === 'admin' && <AdminPanel />}
            </main>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}

export default App
