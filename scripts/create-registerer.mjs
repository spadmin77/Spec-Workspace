import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'server', 'service-account.json'), 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error('Usage: node scripts/create-registerer.mjs <email> <password>');
  process.exit(1);
}

async function main() {
  const user = await auth.createUser({ email: EMAIL, password: PASSWORD });
  await auth.setCustomUserClaims(user.uid, { role: 'registerer' });
  console.log(`Created registerer ${EMAIL} (uid=${user.uid})`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
