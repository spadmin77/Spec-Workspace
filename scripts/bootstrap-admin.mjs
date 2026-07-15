import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'server', 'service-account.json'), 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();

const EMAIL = 'spadmin77@gmail.com';
const PASSWORD = 'qwe123';

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    console.log(`User ${EMAIL} already exists (uid=${user.uid})`);
  } catch {
    user = await auth.createUser({ email: EMAIL, password: PASSWORD });
    console.log(`Created user ${EMAIL} (uid=${user.uid})`);
  }
  await auth.setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`Set role=admin on ${EMAIL}`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
