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

export type Appointment = {
    id: string
    client_id: string
    massage_id: string
    start_time: string
    end_time: string
    status: 'confirmed' | 'cancelled' | 'pending'
    notes: string | null
    google_event_id: string | null
    created_at: string
}

export type Payment = {
    id: string
    appointment_id: string
    amount: number
    method: 'pix' | 'card' | 'cash'
    status: 'paid' | 'pending' | 'partial'
    payment_date: string | null
    created_at: string
}
