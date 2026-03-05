-- Clinica Luciana Supabase Schema

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birth_date DATE,
    notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Massages Table
CREATE TABLE IF NOT EXISTS public.massages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    massage_id UUID REFERENCES public.massages(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'pending',
    notes TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT CHECK (method IN ('pix', 'card', 'cash')),
    status TEXT CHECK (status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.massages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Assuming one admin user for now)
CREATE POLICY "Allow authenticated full access" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON public.massages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON public.appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

-- Public access to massages (for booking if needed in future)
CREATE POLICY "Allow public read access to active massages" ON public.massages FOR SELECT USING (is_active = true);

-- Seed some default massages
INSERT INTO public.massages (name, description, duration_minutes, price) VALUES
('Massagem Relaxante', 'Focada no alívio de tensões e relaxamento profundo.', 60, 150.00),
('Drenagem Linfática', 'Auxilia na eliminação de líquidos e toxinas.', 90, 200.00),
('Pedras Quentes', 'Massagem com pedras aquecidas para relaxamento muscular.', 60, 180.00);
