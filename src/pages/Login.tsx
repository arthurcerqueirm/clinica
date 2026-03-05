import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Flower2 } from 'lucide-react'

export const Login: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth()

    return (
        <div className="min-h-screen bg-cream-light flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose/5 via-cream-light to-sage/5">
            <div className="w-24 h-24 bg-sage/10 rounded-3xl flex items-center justify-center text-sage mb-8 animate-pulse">
                <Flower2 size={48} strokeWidth={1.5} />
            </div>

            <div className="space-y-3 mb-12">
                <h1 className="text-4xl font-display font-bold text-dark tracking-tight">Clinica Luciana</h1>
                <p className="text-dark/40 font-medium text-lg leading-relaxed max-w-[280px]">
                    Seu refúgio particular de bem-estar e relaxamento.
                </p>
            </div>

            <div className="w-full max-w-sm space-y-4">
                <Button
                    onClick={signInWithGoogle}
                    loading={loading}
                    className="w-full h-16 text-lg shadow-xl shadow-sage/20"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
                    Entrar com Google
                </Button>

                <p className="text-[10px] uppercase font-bold text-dark/20 tracking-widest px-8">
                    Ao entrar você concorda com nossos termos e políticas de privacidade
                </p>
            </div>

            <footer className="fixed bottom-12 text-[10px] font-bold text-dark/10 uppercase tracking-[0.2em]">
                Premium Wellness Experience
            </footer>
        </div>
    )
}
