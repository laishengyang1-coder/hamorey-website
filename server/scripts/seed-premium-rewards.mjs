import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });

const requiredEnv = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing MySQL env: ${missing.join(', ')}`);
}

const rewards = [
  {
    id: '5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f01',
    category: '高端礼品',
    name: 'Dior 迪奥口红',
    cover_file_key: 'static:rewards/dior.jpg',
    points_required: 1500,
    stock_quantity: 1,
    description: '具体色号与包装以兑换时实际可采购款式为准；首批限量1件。',
    sort_order: 900,
  },
  {
    id: '5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f02',
    category: '高端礼品',
    name: 'Chanel 香水 50ml',
    cover_file_key: 'static:rewards/chanel.png',
    points_required: 4500,
    stock_quantity: 1,
    description: '具体香型与包装以兑换时实际可采购款式为准；首批限量1件。',
    sort_order: 910,
  },
  {
    id: '5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f03',
    category: '高端礼品',
    name: 'Dyson 入门吹风机 HD08',
    cover_file_key: 'static:rewards/dyson.png',
    points_required: 10000,
    stock_quantity: 1,
    description: '具体颜色与套装以兑换时实际可采购款式为准；首批限量1件。',
    sort_order: 920,
  },
  {
    id: '5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f04',
    category: '高端礼品',
    name: 'Coach 皮质/礼盒腰带',
    cover_file_key: 'static:rewards/coach.jpg',
    points_required: 4500,
    stock_quantity: 1,
    description: '具体款式、尺码与包装以兑换时实际可采购款式为准；首批限量1件。',
    sort_order: 930,
  },
];

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  timezone: 'Z',
});

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();

  for (const reward of rewards) {
    await connection.execute(
      `INSERT INTO rewards
        (id, category, name, cover_file_key, points_required, stock_quantity, stock_status, status, description, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'available', 'active', ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         name = VALUES(name),
         cover_file_key = VALUES(cover_file_key),
         points_required = VALUES(points_required),
         status = 'active',
         description = VALUES(description),
         sort_order = VALUES(sort_order),
         updated_at = UTC_TIMESTAMP()`,
      [
        reward.id,
        reward.category,
        reward.name,
        reward.cover_file_key,
        reward.points_required,
        reward.stock_quantity,
        reward.description,
        reward.sort_order,
      ],
    );
  }

  await connection.commit();
  console.log(`HAMOREY_PREMIUM_REWARDS_READY ${rewards.length}`);
  for (const reward of rewards) {
    console.log(`${reward.name}: ${reward.points_required} points, initial stock ${reward.stock_quantity}`);
  }
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
