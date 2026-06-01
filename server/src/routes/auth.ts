import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index';
import { requireAuth, JWT_SECRET, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }
  const db = await getDb();
  const member = await db.get<any>(
    'SELECT * FROM members WHERE email = ?',
    email.toLowerCase().trim()
  );
  if (!member?.password_hash || !await bcrypt.compare(password, member.password_hash)) {
    res.status(401).json({ error: 'Identifiants incorrects' });
    return;
  }
  const token = jwt.sign(
    { memberId: member.id, name: member.name, email: member.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  const { password_hash: _, ...memberData } = member;
  res.json({ token, member: memberData });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDb();
  const member = await db.get(
    'SELECT id, name, color, emoji, email FROM members WHERE id = ?',
    req.user!.memberId
  );
  if (!member) { res.status(404).json({ error: 'Membre non trouvé' }); return; }
  res.json(member);
});

export default router;
