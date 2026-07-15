import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import serviceAccount from './service-account.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();
const auth = admin.auth();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 4000);
const ADMIN_BOOTSTRAP_EMAIL = process.env.ADMIN_BOOTSTRAP_EMAIL;
const ADMIN_BOOTSTRAP_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;

interface AuthedRequest extends Request {
  uid?: string;
  role?: string;
  email?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const idToken = header.slice('Bearer '.length);
  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    req.email = decoded.email;
    req.role = (decoded as any).role || (decoded as any).claims?.role;
    return next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid ID token', detail: err.message });
  }
}

async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ uid: req.uid, email: req.email, role: req.role ?? null });
});

app.post('/api/users/:uid/role', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { uid } = req.params;
  const { role } = req.body ?? {};
  if (role !== 'admin' && role !== 'registerer') {
    return res.status(400).json({ error: "role must be 'admin' or 'registerer'" });
  }
  try {
    await auth.setCustomUserClaims(uid, { role });
    res.json({ uid, role });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to set role', detail: err.message });
  }
});

app.post('/api/registerers', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    await auth.setCustomUserClaims(user.uid, { role: 'registerer' });
    await db.collection('users').doc(user.uid).set({
      email,
      role: 'registerer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.uid,
    });
    res.status(201).json({ uid: user.uid, email, role: 'registerer' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create registerer', detail: err.message });
  }
});

app.get('/api/registerers', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const snap = await db.collection('users').where('role', '==', 'registerer').get();
    const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    res.json({ registerers: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list registerers', detail: err.message });
  }
});

app.delete('/api/registerers/:uid', requireAuth, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  try {
    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    res.json({ uid, deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete registerer', detail: err.message });
  }
});

async function bootstrapAdmin() {
  if (!ADMIN_BOOTSTRAP_EMAIL || !ADMIN_BOOTSTRAP_PASSWORD) return;
  try {
    let user;
    try {
      user = await auth.getUserByEmail(ADMIN_BOOTSTRAP_EMAIL);
    } catch {
      user = await auth.createUser({
        email: ADMIN_BOOTSTRAP_EMAIL,
        password: ADMIN_BOOTSTRAP_PASSWORD,
      });
      console.log(`[bootstrap] Created admin user ${ADMIN_BOOTSTRAP_EMAIL}`);
    }
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    await db.collection('users').doc(user.uid).set(
      {
        email: ADMIN_BOOTSTRAP_EMAIL,
        role: 'admin',
        bootstrappedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[bootstrap] Ensured admin role for ${ADMIN_BOOTSTRAP_EMAIL} (uid=${user.uid})`);
  } catch (err: any) {
    console.error('[bootstrap] Failed:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Claims server listening on http://localhost:${PORT}`);
  await bootstrapAdmin();
});
