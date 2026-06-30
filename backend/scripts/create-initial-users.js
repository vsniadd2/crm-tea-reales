/**
 * Создание начальных пользователей при первом запуске.
 * Вызывается из database.js, если таблица admins пустая.
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../database');

// point_id: 1 = Червенский, 2 = Палаца; null + accessAllPoints = обе точки (запасной)
const INITIAL_USERS = [
  { username: 'admin', password: '1234', role: 'admin', pointId: null, accessAllPoints: false },
  { username: 'Sotrudnik947', password: '7394', role: 'user', pointId: 2, accessAllPoints: false },
  { username: 'Sotrudnik331', password: '5618', role: 'user', pointId: 2, accessAllPoints: false },
  { username: 'Sotrudnik567', password: '2947', role: 'user', pointId: 1, accessAllPoints: false },
  { username: 'Sotrudnik674', password: '8163', role: 'user', pointId: 1, accessAllPoints: false },
  { username: 'Sotrudnik855', password: '4821', role: 'user', pointId: null, accessAllPoints: true }
];

async function createInitialUsers() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM admins');
    const adminCount = parseInt(result.rows[0].count, 10);

    if (adminCount > 0) {
      console.log('ℹ️ В БД уже есть пользователи, пропускаем создание начальных пользователей');
      return;
    }

    console.log('🔄 Первый запуск: создание начальных пользователей...');

    let created = 0;
    let skipped = 0;

    for (const user of INITIAL_USERS) {
      try {
        const existing = await pool.query(
          'SELECT id FROM admins WHERE username = $1',
          [user.username]
        );

        if (existing.rows.length > 0) {
          console.log(`⚠️ Пользователь ${user.username} уже существует, пропускаем`);
          skipped++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        await pool.query(
          `INSERT INTO admins (username, password, role, point_id, access_all_points)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (username) DO NOTHING`,
          [
            user.username,
            hashedPassword,
            user.role,
            user.pointId ?? null,
            !!user.accessAllPoints
          ]
        );

        console.log(`✅ Пользователь ${user.username} создан (роль: ${user.role})`);
        created++;
      } catch (error) {
        console.error(`❌ Ошибка при создании пользователя ${user.username}:`, error.message);
      }
    }

    console.log(`✅ Создание пользователей завершено. Создано: ${created}, пропущено: ${skipped}`);
  } catch (error) {
    console.error('❌ Ошибка при создании начальных пользователей:', error.message);
  }
}

module.exports = { createInitialUsers, INITIAL_USERS };
