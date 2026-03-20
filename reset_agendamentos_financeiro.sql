-- WARNING: Este script apagará todos os dados financeiros, agendamentos e pacotes.
-- ATENÇÃO: Os dados de Clientes e Massagens SERÃO MANTIDOS intactos.

-- Truncar tabelas para remover todos os registros e reiniciar contadores
TRUNCATE TABLE 
    public.payments, 
    public.package_allowed_massages,
    public.appointments, 
    public.packages 
RESTART IDENTITY CASCADE;

-- Note que as tabelas 'clients' e 'massages' NÃO foram incluídas no TRUNCATE
-- e continuarão existindo normalmente na sua base de dados.
