import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import COS from 'cos-nodejs-sdk-v5';

dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });

const [sourcePath, objectKey] = process.argv.slice(2);
const required = ['COS_SECRET_ID', 'COS_SECRET_KEY', 'COS_BUCKET', 'COS_REGION'];

if (!sourcePath || !objectKey) {
  throw new Error('Usage: node upload-mysql-backup.mjs <source-path> <cos-object-key>');
}

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Backup file does not exist: ${sourcePath}`);
}

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} for COS backup upload`);
  }
}

const fileStats = fs.statSync(sourcePath);
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

await new Promise((resolve, reject) => {
  cos.putObject({
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: objectKey,
    Body: fs.createReadStream(sourcePath),
    ContentLength: fileStats.size,
    ContentType: 'application/gzip',
  }, (error, result) => (error ? reject(error) : resolve(result)));
});

console.log(`COS_MYSQL_BACKUP_UPLOADED ${path.basename(sourcePath)} -> ${objectKey}`);
