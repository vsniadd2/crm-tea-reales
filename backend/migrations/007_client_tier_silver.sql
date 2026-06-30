-- Уровни лояльности: standart (<250), silver (>=250), gold (>=500)
UPDATE clients
SET status = CASE
  WHEN COALESCE(total_spent, 0) >= 500 THEN 'gold'
  WHEN COALESCE(total_spent, 0) >= 250 THEN 'silver'
  ELSE 'standart'
END
WHERE status IS NULL
   OR status NOT IN ('standart', 'silver', 'gold')
   OR status != CASE
        WHEN COALESCE(total_spent, 0) >= 500 THEN 'gold'
        WHEN COALESCE(total_spent, 0) >= 250 THEN 'silver'
        ELSE 'standart'
      END;
