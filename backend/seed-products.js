const { pool, initDatabase } = require('./database');

function asInt(v) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

async function upsertCategory({ name, color = '#000000', icon = null, displayOrder = 0, trackCharts = false }) {
  const res = await pool.query(
    `
      INSERT INTO product_categories (name, color, icon, display_order, track_charts)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO UPDATE SET
        color = EXCLUDED.color,
        icon = EXCLUDED.icon,
        display_order = EXCLUDED.display_order,
        track_charts = EXCLUDED.track_charts,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [name, color, icon, displayOrder, !!trackCharts]
  );
  return res.rows[0].id;
}

async function upsertSubcategory({ categoryId, name, displayOrder = 0 }) {
  const res = await pool.query(
    `
      INSERT INTO product_subcategories (category_id, name, display_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (category_id, name) DO UPDATE SET
        display_order = EXCLUDED.display_order,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [categoryId, name, displayOrder]
  );
  return res.rows[0].id;
}

async function upsertProduct({
  subcategoryId,
  name,
  price,
  description = null,
  imageData = null,
  displayOrder = 0,
  tags = [],
  baseWeightGrams = null
}) {
  const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
  const res = await pool.query(
    `
      INSERT INTO products (subcategory_id, name, price, description, image_data, display_order, tags, base_weight_grams)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (subcategory_id, name) DO UPDATE SET
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        image_data = EXCLUDED.image_data,
        display_order = EXCLUDED.display_order,
        tags = EXCLUDED.tags,
        base_weight_grams = COALESCE(EXCLUDED.base_weight_grams, products.base_weight_grams),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [subcategoryId, name, Number.parseFloat(price) || 0, description, imageData, asInt(displayOrder) ?? 0, tagsStr, asInt(baseWeightGrams)]
  );
  return res.rows[0].id;
}

async function seed() {
  await initDatabase();

  // Уникальные индексы для идемпотентных UPSERT-ов
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_product_categories_name ON product_categories(name)`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_product_subcategories_cat_name ON product_subcategories(category_id, name)`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_products_subcat_name ON products(subcategory_id, name)`);

  // Минимальный набор, чтобы приложение было работоспособно и графики имели что считать
  const drinksCatId = await upsertCategory({
    name: 'Напитки',
    color: '#3b82f6',
    icon: '🍵',
    displayOrder: 10,
    trackCharts: true
  });
  const dessertsCatId = await upsertCategory({
    name: 'Десерты',
    color: '#f59e0b',
    icon: '🍰',
    displayOrder: 20,
    trackCharts: true
  });
  const retailCatId = await upsertCategory({
    name: 'Розница',
    color: '#22c55e',
    icon: '🛍️',
    displayOrder: 30,
    trackCharts: false
  });

  const hotTeaSubId = await upsertSubcategory({ categoryId: drinksCatId, name: 'Горячий чай', displayOrder: 10 });
  const icedTeaSubId = await upsertSubcategory({ categoryId: drinksCatId, name: 'Холодный чай', displayOrder: 20 });
  const teaAddonsSubId = await upsertSubcategory({ categoryId: drinksCatId, name: 'Чай с добавками', displayOrder: 30 });

  const cakesSubId = await upsertSubcategory({ categoryId: dessertsCatId, name: 'Десерты', displayOrder: 10 });

  const packagedTeaSubId = await upsertSubcategory({ categoryId: retailCatId, name: 'Чай фасованный', displayOrder: 10 });
  const merchSubId = await upsertSubcategory({ categoryId: retailCatId, name: 'Мерч', displayOrder: 20 });

  await upsertProduct({ subcategoryId: hotTeaSubId, name: 'Чай чёрный', price: 3.5, displayOrder: 10, tags: ['чай'] });
  await upsertProduct({ subcategoryId: hotTeaSubId, name: 'Чай зелёный', price: 3.5, displayOrder: 20, tags: ['чай'] });
  await upsertProduct({ subcategoryId: icedTeaSubId, name: 'Айс-ти лимонный', price: 4.5, displayOrder: 10, tags: ['чай'] });
  await upsertProduct({ subcategoryId: icedTeaSubId, name: 'Айс-ти персиковый', price: 4.5, displayOrder: 20, tags: ['чай'] });
  await upsertProduct({ subcategoryId: teaAddonsSubId, name: 'Чай с мёдом', price: 4.0, displayOrder: 10, tags: ['чай'] });
  await upsertProduct({ subcategoryId: teaAddonsSubId, name: 'Чай с имбирём', price: 4.5, displayOrder: 20, tags: ['чай'] });

  await upsertProduct({ subcategoryId: cakesSubId, name: 'Чизкейк', price: 8.0, displayOrder: 10, tags: ['десерт'] });
  await upsertProduct({ subcategoryId: cakesSubId, name: 'Брауни', price: 6.5, displayOrder: 20, tags: ['десерт'] });

  await upsertProduct({ subcategoryId: packagedTeaSubId, name: 'Чай листовой 100 г', price: 18.0, displayOrder: 10, tags: ['чай'], baseWeightGrams: 100 });
  await upsertProduct({ subcategoryId: packagedTeaSubId, name: 'Чай листовой 250 г', price: 35.0, displayOrder: 20, tags: ['чай'], baseWeightGrams: 250 });

  await upsertProduct({ subcategoryId: merchSubId, name: 'Термокружка', price: 35.0, displayOrder: 10, tags: ['мерч'] });

  const summary = await pool.query(
    `
      SELECT
        (SELECT COUNT(*)::int FROM product_categories) AS categories,
        (SELECT COUNT(*)::int FROM product_subcategories) AS subcategories,
        (SELECT COUNT(*)::int FROM products) AS products
    `
  );

  const s = summary.rows[0];
  console.log(`✓ Товары/категории готовы. Категорий: ${s.categories}, подкатегорий: ${s.subcategories}, товаров: ${s.products}`);
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Критическая ошибка seed товаров:', e);
    await pool.end().catch(() => {});
    process.exit(1);
  });

