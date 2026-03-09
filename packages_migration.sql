-- 1. Create Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    total_sessions INTEGER NOT NULL,
    remaining_sessions INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Junction table for allowed massages
CREATE TABLE IF NOT EXISTS public.package_allowed_massages (
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    massage_id UUID REFERENCES public.massages(id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, massage_id)
);

-- 3. Ensure columns exist (Fix for "Column not found" error)
-- This part ensures that even if the table was created before, it gets the new columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='package_allowed_massages' AND column_name='quantity_allowed') THEN
        ALTER TABLE public.package_allowed_massages ADD COLUMN quantity_allowed INTEGER NOT NULL DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='package_allowed_massages' AND column_name='quantity_used') THEN
        ALTER TABLE public.package_allowed_massages ADD COLUMN quantity_used INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 4. Add package_id to Appointments and Payments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_allowed_massages ENABLE ROW LEVEL SECURITY;

-- 6. Policies
DROP POLICY IF EXISTS "Allow authenticated full access packages" ON public.packages;
CREATE POLICY "Allow authenticated full access packages" ON public.packages FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access package_allowed_massages" ON public.package_allowed_massages;
CREATE POLICY "Allow authenticated full access package_allowed_massages" ON public.package_allowed_massages FOR ALL USING (auth.role() = 'authenticated');
