import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('AuthContext: Initializing...')
        console.log('AuthContext: Current URL:', window.location.href)

        const handleSession = async (session: Session | null) => {
            console.log('AuthContext: Handling session, hasProviderToken:', !!session?.provider_token)

            let finalSession = session

            // Persist provider_token in sessionStorage because Supabase doesn't persist it across reloads
            if (session?.provider_token) {
                console.log('AuthContext: Storing provider_token in sessionStorage')
                sessionStorage.setItem('google_provider_token', session.provider_token)
            } else if (session && !session.provider_token) {
                const storedToken = sessionStorage.getItem('google_provider_token')
                if (storedToken) {
                    console.log('AuthContext: Restoring provider_token from sessionStorage')
                    finalSession = { ...session, provider_token: storedToken }
                }
            }

            setSession(finalSession)
            setUser(finalSession?.user ?? null)
            setLoading(false)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthContext: onAuthStateChange event:', event, 'hasSession:', !!session, 'hasProviderToken:', !!session?.provider_token)
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
                handleSession(session)
            }
        })

        // Initial check and manual hash parsing fallback
        const initAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) console.error('AuthContext: getSession error:', error)

            if (session) {
                handleSession(session)
            } else if (window.location.hash) {
                console.log('AuthContext: Found hash but no session, attempting manual parse...')
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const providerToken = hashParams.get('provider_token')

                if (providerToken) {
                    console.log('AuthContext: Found provider_token in hash, storing...')
                    sessionStorage.setItem('google_provider_token', providerToken)
                }

                if (accessToken) {
                    const { data, error: hashError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || '',
                    })
                    if (hashError) console.error('AuthContext: setSession error:', hashError)
                    if (data.session) handleSession(data.session)
                    else setLoading(false)
                } else {
                    setLoading(false)
                }
            } else {
                setLoading(false)
            }
        }

        initAuth()

        return () => subscription.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar'
            }
        })
        if (error) throw error
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    return (
        <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
