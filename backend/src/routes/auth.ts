import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  walletAddr: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation failed', details: parsed.error.issues });
    return;
  }
  const { username, email, password, walletAddr } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    res.status(409).json({ error: 'username or email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: passwordHash, walletAddr },
  });

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation failed' });
    return;
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  });
  if (!user) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const full = await prisma.user.findUnique({ where: { id: user.userId }, select: { id: true, username: true, email: true, role: true, walletAddr: true, createdAt: true } });
  res.json(full);
});
