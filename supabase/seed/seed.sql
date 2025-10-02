-- Sample data in Portuguese (UI-visible names)
insert into public.customers (id, full_name, phone, email)
values
  (gen_random_uuid(), 'João Silva', '+55 11 90000-0001', 'joao.silva@example.com'),
  (gen_random_uuid(), 'Maria Souza', '+55 11 90000-0002', 'maria.souza@example.com'),
  (gen_random_uuid(), 'Carlos Pereira', '+55 11 90000-0003', 'carlos.pereira@example.com'),
  (gen_random_uuid(), 'Ana Lima', '+55 11 90000-0004', 'ana.lima@example.com'),
  (gen_random_uuid(), 'Pedro Santos', '+55 11 90000-0005', 'pedro.santos@example.com');

-- Minimal products
insert into public.products (id, sku, name, category, unit_cost, unit_price, stock_qty, reorder_level)
values
  (gen_random_uuid(), 'IP12-TELA', 'Tela iPhone 12', 'Peças', 500, 900, 5, 2),
  (gen_random_uuid(), 'S21-BAT', 'Bateria Samsung S21', 'Peças', 120, 280, 8, 3),
  (gen_random_uuid(), 'CAPA-UNIV', 'Capa universal', 'Acessórios', 10, 35, 20, 5);
