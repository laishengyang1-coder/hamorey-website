import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import COS from 'cos-nodejs-sdk-v5';

const envFile = process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env';
dotenv.config({ path: envFile });

const required = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'COS_SECRET_ID', 'COS_SECRET_KEY', 'COS_BUCKET', 'COS_REGION'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

function cosCall(client, method, options) {
  return new Promise((resolve, reject) => {
    client[method](options, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

try {
  const [rows] = await connection.query(
    `SELECT DISTINCT cover_file_key
     FROM rewards
     WHERE cover_file_key IS NOT NULL
       AND cover_file_key <> ''
       AND cover_file_key LIKE 'reward-covers/%'`,
  );
  const keys = rows.map((row) => row.cover_file_key);
  const client = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  });

  let published = 0;
  for (const key of keys) {
    await cosCall(client, 'putObjectAcl', {
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: key,
      ACL: 'public-read',
    });
    published += 1;
  }

  console.log(`HAMOREY_REWARD_COVERS_PUBLIC ${published}/${keys.length}`);
} finally {
  await connection.end();
}
