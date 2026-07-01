-- Базовая граммовка товара (для цены) и фактическая граммовка в позиции заказа
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_weight_grams INTEGER;
ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS weight_grams INTEGER;
