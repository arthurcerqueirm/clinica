export type Profile = {
    id: string
    name: string
    phone: string | null
    email: string | null
    birth_date: string | null
    notes: string | null
    avatar_url: string | null
    created_at: string
}

export type Massage = {
    id: string
    name: string
    description: string | null
    duration_minutes: number
    price: number
    is_active: boolean
    image_url: string | null
}

export type Package = {
    id: string
    client_id: string
    total_sessions: number
    remaining_sessions: number
    total_amount: number
    status: 'active' | 'completed' | 'cancelled'
    created_at: string
}

export type PackageAllowedMassage = {
    package_id: string
    massage_id: string
    quantity_allowed: number
    quantity_used: number
}

export type Appointment = {
    id: string
    client_id: string
    massage_id: string
    package_id: string | null
    start_time: string
    end_time: string
    status: 'confirmed' | 'cancelled' | 'pending'
    notes: string | null
    google_event_id: string | null
    created_at: string
}

export type Payment = {
    id: string
    appointment_id: string | null
    package_id: string | null
    amount: number
    method: 'pix' | 'card' | 'cash'
    status: 'paid' | 'pending' | 'partial'
    payment_date: string | null
    created_at: string
}
