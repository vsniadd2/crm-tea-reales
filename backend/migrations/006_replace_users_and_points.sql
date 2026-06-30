-- Переименование точки 2: Валерианова → Палаца
UPDATE points SET name = 'Палаца' WHERE id = 2;

-- Запасной сотрудник: доступ к обеим точкам (как у admin в фильтрах, но role = user)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS access_all_points BOOLEAN DEFAULT false;

-- Админ видит все точки: point_id = NULL (отменяем привязку из 002_admin_point_chervenskiy)
UPDATE admins SET point_id = NULL, access_all_points = false WHERE role = 'admin';

-- Замена всех учётных записей на новый набор
DELETE FROM admins;

INSERT INTO admins (username, password, role, point_id, access_all_points) VALUES
  ('admin', '$2a$10$25z3Il4TEwQ/zTxXnD/wp.BknzmizjQZvvXO8tWh939y5WsjBtGqK', 'admin', NULL, false),
  ('Sotrudnik947', '$2a$10$/0BKpPjDT73M0jg7BOQeReMOir2t4gKV8XgVBSEaOFqycKFt50.g6', 'user', 2, false),
  ('Sotrudnik331', '$2a$10$I7YbukZfUqmH9cEwu4F8F.JHaKpyA/RKHR.20IPRLjD3Y5fljcOVC', 'user', 2, false),
  ('Sotrudnik567', '$2a$10$e/DzIdNmMOsJ7VpXT3.evuawt9tujCj6fvjipd4WSn81Bx4akVVK2', 'user', 1, false),
  ('Sotrudnik674', '$2a$10$qkV08S/dzFW/Z5ia5AtJG.X3buaR/ymlpae2cUs4B5y8tx3iPBcq2', 'user', 1, false),
  ('Sotrudnik855', '$2a$10$50kUo8ar.lUCguzpLyf.be0vUAg0liLqbss3425FvpFatmwMQdS.K', 'user', NULL, true);

SELECT setval(pg_get_serial_sequence('admins', 'id'), COALESCE((SELECT MAX(id) FROM admins), 1));
