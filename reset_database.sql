-- WARNING: This script will delete ALL data from the following tables.
-- Run this only if you want to start from absolute zero in terms of records.

-- Disable RLS temporarily if needed (usually not required for truncation via SQL Editor)

-- Truncate tables to remove all records and reset identity counters
TRUNCATE TABLE 
    public.payments, 
    public.package_allowed_massages,
    public.appointments, 
    public.packages,
    public.clients 
RESTART IDENTITY CASCADE;

-- If you also want to remove massage types, uncomment the line below:
-- TRUNCATE TABLE public.massages RESTART IDENTITY CASCADE;

-- Safety Note: Truncating 'clients' with CASCADE will remove everything 
-- linked to them (appointments, packages, etc.) which is what you want.
