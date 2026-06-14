import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const nodesRouter = Router();

nodesRouter.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  gpuType: z.string(),
  gpuCount: z.number().int().min(1).default(1),
  hashrate: z.number().min(0),
  vram: z.number().int().min(0).default(0),
  location: z.string().optional(),
  ip: z.string().optional(),
  stakeAmount: z.number().min(1000).default(1000),
});

const MIN_STAKE = 1000;

nodesRouter.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const nodes = await prisma.node.findMany({
    where: user.role === 'admin' ? {} : { userId: user.userId },
    include: { _count: { select: { hashrateHistory: true, tasks: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(nodes);
});

nodesRouter.get('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const node = await prisma.node.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      hashrateHistory: { orderBy: { recordedAt: 'asc' }, take: 1440 },
      _count: { select: { earnings: true, tasks: true } },
    },
  });
  if (!node) { res.status(404).json({ error: 'node not found' }); return; }
  if (user.role !== 'admin' && node.userId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  res.json(node);
});

nodesRouter.post('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation failed', details: parsed.error.issues });
    return;
  }
  const node = await prisma.node.create({
    data: { ...parsed.data, userId: user.userId, status: 'offline' },
  });
  res.status(201).json(node);
});

nodesRouter.post('/:id/stake', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  const existing = await prisma.node.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: 'node not found' }); return; }
  if (user.role !== 'admin' && existing.userId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }

  const additional = Math.max(0, parseFloat(req.body.amount) || 0);
  const newStake = existing.stakeAmount + additional;

  if (newStake < MIN_STAKE) {
    res.status(400).json({ error: `minimum stake is ${MIN_STAKE} ECT` }); return;
  }

  const node = await prisma.node.update({
    where: { id },
    data: { stakeAmount: newStake },
  });
  res.json(node);
});

nodesRouter.put('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  const existing = await prisma.node.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: 'node not found' }); return; }
  if (user.role !== 'admin' && existing.userId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  const node = await prisma.node.update({
    where: { id },
    data: {
      name: req.body.name !== undefined ? req.body.name : existing.name,
      gpuType: req.body.gpuType !== undefined ? req.body.gpuType : existing.gpuType,
      gpuCount: req.body.gpuCount !== undefined ? req.body.gpuCount : existing.gpuCount,
      hashrate: req.body.hashrate !== undefined ? req.body.hashrate : existing.hashrate,
      vram: req.body.vram !== undefined ? req.body.vram : existing.vram,
      status: req.body.status !== undefined ? req.body.status : existing.status,
      location: req.body.location !== undefined ? req.body.location : existing.location,
      ip: req.body.ip !== undefined ? req.body.ip : existing.ip,
      stakeAmount: req.body.stakeAmount !== undefined ? req.body.stakeAmount : existing.stakeAmount,
      lastSeen: req.body.status === 'online' ? new Date() : existing.lastSeen,
    },
  });
  res.json(node);
});

nodesRouter.delete('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  const existing = await prisma.node.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: 'node not found' }); return; }
  if (user.role !== 'admin' && existing.userId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  await prisma.node.delete({ where: { id } });
  res.json({ ok: true });
});
