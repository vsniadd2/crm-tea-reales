/**
 * Тестовое наполнение БД: категории, чай и сопутствующие товары, клиенты, покупки.
 *
 *   node seed.js           — идемпотентно: upsert товаров, добавить недостающих клиентов и покупки
 *   node seed.js --reset   — очистить клиентов/заказы и залить заново (только для dev/test)
 */

const { pool, initDatabase } = require('./database');
const { statusFromTotalSpent } = require('./clientTier');

const RESET = process.argv.includes('--reset');

function asInt(v) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomInt(10, 20), randomInt(0, 59), 0, 0);
  return d;
}

async function ensureUniqueIndexes() {
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_product_categories_name ON product_categories(name)`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_product_subcategories_cat_name ON product_subcategories(category_id, name)`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_products_subcat_name ON products(subcategory_id, name)`);
}

async function upsertCategory({ name, color = '#4d7a42', icon = null, displayOrder = 0, trackCharts = false }) {
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
  displayOrder = 0,
  tags = []
}) {
  const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
  const res = await pool.query(
    `
      INSERT INTO products (subcategory_id, name, price, description, display_order, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (subcategory_id, name) DO UPDATE SET
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        display_order = EXCLUDED.display_order,
        tags = EXCLUDED.tags,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, price
    `,
    [subcategoryId, name, Number.parseFloat(price) || 0, description, asInt(displayOrder) ?? 0, tagsStr]
  );
  return res.rows[0];
}

const CATEGORY_ICONS = {
  leafTea: 'https://api.iconify.design/mdi/leaf.svg?color=%234d7a42',
  hallDrinks: 'https://api.iconify.design/mdi/glass-mug-variant.svg?color=%236fa85e',
  desserts: 'https://api.iconify.design/mdi/cake-variant.svg?color=%23b45309',
  tableware: 'https://api.iconify.design/mdi/teapot.svg?color=%2378716c'
};

const TEA_CATALOG = [
  {
    category: { name: 'Листовой чай', color: '#4d7a42', icon: CATEGORY_ICONS.leafTea, displayOrder: 10, trackCharts: true },
    subcategories: [
      {
        name: 'Зелёный чай',
        products: [
          { name: 'Сенча', price: 12.5, description: 'Японский зелёный чай, свежий травяной вкус', tags: ['чай', 'зелёный'] },
          { name: 'Ганпаудер', price: 14.0, description: 'Китайский зелёный чай с округлым вкусом', tags: ['чай', 'зелёный'] },
          { name: 'Матча Ceremonial', price: 28.0, description: 'Порошковый чай для церемонии и латте', tags: ['чай', 'матча'] },
          { name: 'Жасминовый зелёный', price: 13.5, description: 'Аромат жасмина, мягкое послевкусие', tags: ['чай', 'зелёный', 'ароматизированный'] }
        ]
      },
      {
        name: 'Чёрный чай',
        products: [
          { name: 'Ассам', price: 11.0, description: 'Малабарский чёрный чай, насыщенный и крепкий', tags: ['чай', 'чёрный'] },
          { name: 'Дарджилинг', price: 16.5, description: '«Шампанское среди чаёв», muscatel-ноты', tags: ['чай', 'чёрный'] },
          { name: 'Earl Grey', price: 12.0, description: 'Чёрный чай с маслом бергамота', tags: ['чай', 'чёрный', 'ароматизированный'] },
          { name: 'English Breakfast', price: 10.5, description: 'Купаж для утренней чашки', tags: ['чай', 'чёрный'] }
        ]
      },
      {
        name: 'Улун',
        products: [
          { name: 'Те Гуань Инь', price: 18.0, description: 'Классический тайваньский улун', tags: ['чай', 'улун'] },
          { name: 'Молочный улун', price: 15.0, description: 'Сливочные ноты, лёгкая сладость', tags: ['чай', 'улун'] },
          { name: 'Da Hong Pao', price: 32.0, description: 'Премиальный уишаньский улун', tags: ['чай', 'улун', 'премиум'] }
        ]
      },
      {
        name: 'Белый и пуэр',
        products: [
          { name: 'Бай Му Дань', price: 19.0, description: 'Белый чай «белые брови»', tags: ['чай', 'белый'] },
          { name: 'Шэн пуэр 2018', price: 22.0, description: 'Сырой пуэр, цветочный профиль', tags: ['чай', 'пуэр'] },
          { name: 'Шу пуэр', price: 14.5, description: 'Выдержанный, землистый вкус', tags: ['чай', 'пуэр'] }
        ]
      }
    ]
  },
  {
    category: { name: 'Напитки в зале', color: '#6fa85e', icon: CATEGORY_ICONS.hallDrinks, displayOrder: 20, trackCharts: true },
    subcategories: [
      {
        name: 'Горячие напитки',
        products: [
          { name: 'Чай с облепихой и мёдом', price: 5.5, description: 'Согревающий напиток', tags: ['напиток', 'горячий'] },
          { name: 'Имбирный чай', price: 5.0, description: 'Имбирь, лимон, мёд', tags: ['напиток', 'горячий'] },
          { name: 'Латте матча', price: 7.5, description: 'Матча на молоке', tags: ['напиток', 'матча'] },
          { name: 'Какао с корицей', price: 6.5, description: 'Густое какао', tags: ['напиток', 'горячий'] }
        ]
      },
      {
        name: 'Холодные напитки',
        products: [
          { name: 'Айс-ти лимонный', price: 4.5, description: 'Чёрный чай со льдом и лимоном', tags: ['напиток', 'холодный'] },
          { name: 'Айс-ти персиковый', price: 4.5, description: 'Лёгкий летний напиток', tags: ['напиток', 'холодный'] },
          { name: 'Лимонад матча', price: 6.0, description: 'Матча, лайм, содовая', tags: ['напиток', 'матча', 'холодный'] },
          { name: 'Холодный пуэр лимон', price: 5.5, description: 'Освежающий пуэр', tags: ['напиток', 'холодный', 'пуэр'] }
        ]
      }
    ]
  },
  {
    category: { name: 'Десерты к чаю', color: '#b45309', icon: CATEGORY_ICONS.desserts, displayOrder: 30, trackCharts: true },
    subcategories: [
      {
        name: 'Выпечка',
        products: [
          { name: 'Печенье Matcha', price: 4.0, description: '3 шт., зелёный чай в тесте', tags: ['десерт'] },
          { name: 'Скон с изюмом', price: 5.0, description: 'К английскому завтраку', tags: ['десерт'] },
          { name: 'Макарон (2 шт.)', price: 6.5, description: 'Ассорти вкусов', tags: ['десерт'] },
          { name: 'Чизкейк New York', price: 8.5, description: 'Классический сливочный', tags: ['десерт'] }
        ]
      }
    ]
  },
  {
    category: { name: 'Посуда и подарки', color: '#78716c', icon: CATEGORY_ICONS.tableware, displayOrder: 40, trackCharts: false },
    subcategories: [
      {
        name: 'Посуда',
        products: [
          { name: 'Гайвань фарфор 120 мл', price: 45.0, description: 'Для заваривания улунов', tags: ['посуда'] },
          { name: 'Чайник глина 200 мл', price: 65.0, description: 'Исыныская глина', tags: ['посуда'] },
          { name: 'Термокружка Tea', price: 35.0, description: '350 мл, двойные стенки', tags: ['мерч'] }
        ]
      },
      {
        name: 'Наборы',
        products: [
          { name: 'Набор пробников 6×10 г', price: 24.0, description: '6 сортов листового чая', tags: ['подарок', 'чай'] },
          { name: 'Подарочный бокс «Утро с чаем»', price: 89.0, description: 'Чай, печенье, кружка', tags: ['подарок'] },
          { name: 'Чай листовой 100 г (упаковка)', price: 18.0, description: 'На выбор сорт из каталога', tags: ['чай', 'розница'] }
        ]
      }
    ]
  }
];

const MOCK_CLIENTS = [
  { firstName: 'Анна', lastName: 'Ковалева', middleName: 'Игоревна', clientId: '+375291000001', status: 'gold', personalDiscount: 5, accountBalance: 12.5, totalSpent: 620 },
  { firstName: 'Дмитрий', lastName: 'Лебедев', middleName: null, clientId: '+375291000002', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 145 },
  { firstName: 'Елена', lastName: 'Морозова', middleName: 'Петровна', clientId: '+375291000003', status: 'gold', personalDiscount: 0, accountBalance: 25, totalSpent: 780 },
  { firstName: 'Иван', lastName: 'Родненков', middleName: 'Сергеевич', clientId: '+375291000004', status: 'standart', personalDiscount: 10, accountBalance: 0, totalSpent: 89 },
  { firstName: 'Мария', lastName: 'Соколова', middleName: null, clientId: '+375291000005', status: 'standart', personalDiscount: 0, accountBalance: 5, totalSpent: 210 },
  { firstName: 'Алексей', lastName: 'Новиков', middleName: 'Андреевич', clientId: '+375291000006', status: 'gold', personalDiscount: 3, accountBalance: 0, totalSpent: 540 },
  { firstName: 'Ольга', lastName: 'Кузнецова', middleName: 'Викторовна', clientId: '+375291000007', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 67 },
  { firstName: 'Павел', lastName: 'Волков', middleName: null, clientId: '+375291000008', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 32 },
  { firstName: 'Наталья', lastName: 'Белова', middleName: 'Олеговна', clientId: '+375291000009', status: 'gold', personalDiscount: 0, accountBalance: 40, totalSpent: 910 },
  { firstName: 'Сергей', lastName: 'Орлов', middleName: 'Николаевич', clientId: '+375291000010', status: 'standart', personalDiscount: 7, accountBalance: 0, totalSpent: 178 },
  { firstName: 'Татьяна', lastName: 'Зайцева', middleName: null, clientId: '+375291000011', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 95 },
  { firstName: 'Кирилл', lastName: 'Павлов', middleName: 'Дмитриевич', clientId: '+375291000012', status: 'gold', personalDiscount: 0, accountBalance: 15, totalSpent: 650 },
  { firstName: 'Виктория', lastName: 'Смирнова', middleName: 'Александровна', clientId: '+375291000013', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 44 },
  { firstName: 'Максим', lastName: 'Фёдоров', middleName: null, clientId: '+375291000014', status: 'standart', personalDiscount: 0, accountBalance: 8, totalSpent: 120 },
  { firstName: 'Юлия', lastName: 'Михайлова', middleName: 'Романовна', clientId: '+375291000015', status: 'gold', personalDiscount: 5, accountBalance: 0, totalSpent: 520 },
  { firstName: 'Артём', lastName: 'Громов', middleName: null, clientId: '+375291000016', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 18 },
  { firstName: 'Светлана', lastName: 'Егорова', middleName: 'Ивановна', clientId: '+375291000017', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 256 },
  { firstName: 'Никита', lastName: 'Комаров', middleName: 'Владимирович', clientId: '+375291000018', status: 'gold', personalDiscount: 0, accountBalance: 30, totalSpent: 590 },
  { firstName: 'Ирина', lastName: 'Ларина', middleName: null, clientId: '+375291000019', status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 73 },
  { firstName: 'Без', lastName: 'карты', middleName: null, clientId: null, status: 'standart', personalDiscount: 0, accountBalance: 0, totalSpent: 0 }
];

const TEST_CLIENT_ID_PREFIX = '+3752910000';

async function seedProducts() {
  const allProducts = [];

  for (const block of TEA_CATALOG) {
    const categoryId = await upsertCategory(block.category);
    for (let si = 0; si < block.subcategories.length; si++) {
      const sub = block.subcategories[si];
      const subcategoryId = await upsertSubcategory({
        categoryId,
        name: sub.name,
        displayOrder: (si + 1) * 10
      });
      for (let pi = 0; pi < sub.products.length; pi++) {
        const p = sub.products[pi];
        const product = await upsertProduct({
          subcategoryId,
          name: p.name,
          price: p.price,
          description: p.description,
          displayOrder: (pi + 1) * 10,
          tags: p.tags
        });
        allProducts.push(product);
      }
    }
  }

  return allProducts;
}

async function resetClientsAndOrders() {
  console.log('⚠️  --reset: удаление клиентов и заказов...');
  await pool.query('TRUNCATE transaction_items, transactions, clients RESTART IDENTITY CASCADE');
}

async function upsertClient(client) {
  const res = await pool.query(
    `
      INSERT INTO clients (
        first_name, last_name, middle_name, client_id,
        status, total_spent, personal_discount_percent, account_balance,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $8)
      ON CONFLICT (client_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        middle_name = EXCLUDED.middle_name,
        personal_discount_percent = EXCLUDED.personal_discount_percent,
        account_balance = EXCLUDED.account_balance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, client_id, status, total_spent
    `,
    [
      client.firstName,
      client.lastName,
      client.middleName,
      client.clientId,
      client.status,
      client.personalDiscount,
      client.accountBalance,
      daysAgo(randomInt(30, 365))
    ]
  );
  return res.rows[0];
}

async function clientHasTransactions(clientDbId) {
  const res = await pool.query(
    'SELECT 1 FROM transactions WHERE client_id = $1 LIMIT 1',
    [clientDbId]
  );
  return res.rows.length > 0;
}

async function createPurchase({ clientId, products, pointId, createdAt }) {
  const itemCount = randomInt(1, Math.min(3, products.length));
  const picked = [];
  const used = new Set();
  while (picked.length < itemCount) {
    const p = randomItem(products);
    if (used.has(p.id)) continue;
    used.add(p.id);
    picked.push({ ...p, quantity: randomInt(1, 2) });
  }

  const amount = picked.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const discount = 0;
  const finalAmount = amount;
  const paymentMethods = ['cash', 'card', 'card', 'cash'];
  const paymentMethod = randomItem(paymentMethods);

  const txRes = await pool.query(
    `
      INSERT INTO transactions (
        client_id, amount, discount, final_amount,
        payment_method, point_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [clientId, amount, discount, finalAmount, paymentMethod, pointId, createdAt]
  );
  const transactionId = txRes.rows[0].id;

  for (const item of picked) {
    await pool.query(
      `
        INSERT INTO transaction_items (transaction_id, product_id, product_name, product_price, quantity)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [transactionId, String(item.id), item.name, item.price, item.quantity]
    );
  }

  return finalAmount;
}

async function recalcClientTotals(clientDbId) {
  const sumRes = await pool.query(
    `
      SELECT COALESCE(SUM(final_amount), 0)::numeric AS total
      FROM transactions
      WHERE client_id = $1
    `,
    [clientDbId]
  );
  const total = Number.parseFloat(sumRes.rows[0].total) || 0;
  const status = statusFromTotalSpent(total);
  await pool.query(
    `
      UPDATE clients
      SET total_spent = $1, status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
    [total, status, clientDbId]
  );
  return { total, status };
}

async function seedClientsAndPurchases(products) {
  const pointRes = await pool.query('SELECT id FROM points ORDER BY id LIMIT 1');
  const pointId = pointRes.rows[0]?.id ?? 1;

  let clientsInserted = 0;
  let purchasesCreated = 0;

  for (const mock of MOCK_CLIENTS) {
    if (mock.clientId == null) {
      const existing = await pool.query(
        `
          SELECT id FROM clients
          WHERE first_name = $1 AND last_name = $2
            AND COALESCE(middle_name, '') = COALESCE($3, '')
          LIMIT 1
        `,
        [mock.firstName, mock.lastName, mock.middleName]
      );
      if (existing.rows.length > 0 && !RESET) continue;

      if (RESET && existing.rows.length > 0) {
        await pool.query('DELETE FROM clients WHERE id = $1', [existing.rows[0].id]);
      }

      const ins = await pool.query(
        `
          INSERT INTO clients (
            first_name, last_name, middle_name, client_id,
            status, total_spent, personal_discount_percent, account_balance,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, NULL, 'standart', 0, 0, 0, $4, $4)
          RETURNING id
        `,
        [mock.firstName, mock.lastName, mock.middleName, daysAgo(randomInt(60, 180))]
      );
      clientsInserted++;
      if (RESET || !(await clientHasTransactions(ins.rows[0].id))) {
        const purchaseCount = randomInt(1, 2);
        for (let i = 0; i < purchaseCount; i++) {
          await createPurchase({
            clientId: ins.rows[0].id,
            products,
            pointId,
            createdAt: daysAgo(randomInt(5, 90))
          });
          purchasesCreated++;
        }
        await recalcClientTotals(ins.rows[0].id);
      }
      continue;
    }

    const row = await upsertClient(mock);
    clientsInserted++;

    const needsPurchases = RESET || !(await clientHasTransactions(row.id));
    if (!needsPurchases) continue;

    const purchaseCount = mock.totalSpent > 400 ? randomInt(4, 8) : randomInt(2, 5);
    for (let i = 0; i < purchaseCount; i++) {
      await createPurchase({
        clientId: row.id,
        products,
        pointId,
        createdAt: daysAgo(randomInt(3, 300))
      });
      purchasesCreated++;
    }
    await recalcClientTotals(row.id);
  }

  return { clientsInserted, purchasesCreated };
}

async function seed() {
  console.log('🍵 Tea CRM — тестовое наполнение БД\n');
  await initDatabase();
  await ensureUniqueIndexes();

  if (RESET) {
    await resetClientsAndOrders();
  }

  console.log('📦 Товары и категории...');
  const products = await seedProducts();
  console.log(`   ✓ ${products.length} товаров в каталоге`);

  console.log('👥 Клиенты и покупки...');
  const { clientsInserted, purchasesCreated } = await seedClientsAndPurchases(products);
  console.log(`   ✓ обработано клиентов: ${clientsInserted}, создано покупок: ${purchasesCreated}`);

  const summary = await pool.query(
    `
      SELECT
        (SELECT COUNT(*)::int FROM product_categories) AS categories,
        (SELECT COUNT(*)::int FROM product_subcategories) AS subcategories,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM clients) AS clients,
        (SELECT COUNT(*)::int FROM transactions) AS transactions,
        (SELECT COUNT(*)::int FROM clients WHERE status = 'gold') AS gold_clients,
        (SELECT COUNT(*)::int FROM clients WHERE status = 'silver') AS silver_clients
    `
  );
  const s = summary.rows[0];
  console.log('\n✅ Готово:');
  console.log(`   Категорий: ${s.categories}, подкатегорий: ${s.subcategories}, товаров: ${s.products}`);
  console.log(`   Клиентов: ${s.clients} (Silver: ${s.silver_clients}, Gold: ${s.gold_clients}), транзакций: ${s.transactions}`);
  console.log(`\n   Тестовые клиенты помечены телефонами ${TEST_CLIENT_ID_PREFIX}XX`);
  console.log('   Повторный запуск без --reset не дублирует покупки существующим клиентам.\n');
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Критическая ошибка seed:', e);
    await pool.end().catch(() => {});
    process.exit(1);
  });
