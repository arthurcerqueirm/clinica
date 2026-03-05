-- Clinica Luciana Seed Data
-- Import this into your Supabase SQL Editor AFTER the schema is created.

-- 1. Insert Massages (Services)
INSERT INTO public.massages (name, description, duration_minutes, price) VALUES
('Massagem Relaxante', 'Focada no alívio de tensões e relaxamento profundo através de manobras suaves.', 60, 150.00),
('Drenagem Linfática', 'Técnica de massagem que auxilia na eliminação de líquidos e toxinas do corpo.', 90, 200.00),
('Pedras Quentes', 'Massagem terapêutica com pedras vulcânicas aquecidas para alívio muscular.', 60, 180.00),
('Massagem Desportiva', 'Ideal para atletas, foca na recuperação muscular e prevenção de lesões.', 60, 170.00),
('Limpeza de Pele', 'Procedimento estético para remoção de impurezas e renovação celular.', 60, 120.00);

-- 2. Insert Realistic Clients
INSERT INTO public.clients (name, phone, email, notes) VALUES
('Adriana Lima', '(11) 98765-4321', 'adriana.lima@email.com', 'Prefere pressão moderada na massagem relaxante.'),
('Beatriz Souza', '(11) 91234-5678', 'beatriz.souza@email.com', 'Faz drenagem toda semana.'),
('Carla Mendes', '(11) 99887-7665', 'carla.mendes@email.com', 'Inadimplente - pendência da última sessão.'),
('Daniela Rocha', '(11) 95544-3322', 'daniela.rocha@email.com', 'Gosta de óleo de lavanda.'),
('Eliana Fontes', '(11) 94433-2211', 'eliana.fontes@email.com', 'Paciente grávida - cuidado extra na lombar.'),
('Fernanda Costa', '(11) 93322-1100', 'fernanda.costa@email.com', null);

-- 3. Insert some Appointments (simulating past and future)
-- Note: Replace gen_random_uuid() with specific IDs if you want to link strictly, 
-- but this script uses subqueries for portability.

DO $$
DECLARE
    client_id_1 UUID;
    client_id_2 UUID;
    massage_id_1 UUID;
    massage_id_2 UUID;
BEGIN
    SELECT id INTO client_id_1 FROM public.clients WHERE name = 'Adriana Lima' LIMIT 1;
    SELECT id INTO client_id_2 FROM public.clients WHERE name = 'Beatriz Souza' LIMIT 1;
    SELECT id INTO massage_id_1 FROM public.massages WHERE name = 'Massagem Relaxante' LIMIT 1;
    SELECT id INTO massage_id_2 FROM public.massages WHERE name = 'Drenagem Linfática' LIMIT 1;

    -- Recent Past Appointment
    INSERT INTO public.appointments (client_id, massage_id, start_time, end_time, status)
    VALUES (client_id_1, massage_id_1, now() - interval '2 days', now() - interval '2 days' + interval '60 minutes', 'confirmed');

    -- Upcoming Appointment
    INSERT INTO public.appointments (client_id, massage_id, start_time, end_time, status)
    VALUES (client_id_1, massage_id_1, now() + interval '1 day' + interval '9 hours', now() + interval '1 day' + interval '10 hours', 'confirmed');

    -- Another Upcoming
    INSERT INTO public.appointments (client_id, massage_id, start_time, end_time, status)
    VALUES (client_id_2, massage_id_2, now() + interval '2 hours', now() + interval '3 hours 30 minutes', 'confirmed');
END $$;

-- 4. Insert Payments
DO $$
DECLARE
    apt_id_1 UUID;
    apt_id_2 UUID;
BEGIN
    SELECT id INTO apt_id_1 FROM public.appointments WHERE status = 'confirmed' LIMIT 1;
    
    INSERT INTO public.payments (appointment_id, amount, method, status, payment_date)
    VALUES (apt_id_1, 150.00, 'pix', 'paid', now() - interval '2 days');
END $$;
