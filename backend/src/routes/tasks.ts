import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  proofType: z.enum(['zk', 'tee', 'hybrid']).default('zk'),
  rewardAmount: z.number().min(0).default(0),
  gpuRequirement: z.string().optional(),
  deadline: z.string().datetime().optional(),
});

tasksRouter.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const tasks = await prisma.task.findMany({
    where: user.role === 'admin' ? {} : { requestorId: user.userId },
    include: {
      requestor: { select: { id: true, username: true } },
      worker: { select: { id: true, name: true, gpuType: true } },
      _count: { select: { proofs: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(tasks);
});

tasksRouter.get('/worker/:nodeId', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const nodeId = parseInt(req.params.nodeId);
  const node = await prisma.node.findUnique({ where: { id: nodeId } });
  if (!node || (user.role !== 'admin' && node.userId !== user.userId)) {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  const tasks = await prisma.task.findMany({
    where: { workerId: nodeId },
    include: { requestor: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

tasksRouter.post('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation failed', details: parsed.error.issues });
    return;
  }

  const taskHash = crypto.createHash('sha256')
    .update(`${user.userId}-${parsed.data.title}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      requestorId: user.userId,
      taskHash,
      lockedAmount: parsed.data.rewardAmount,
      status: 'pending',
    },
  });
  res.status(201).json(task);
});

tasksRouter.post('/:id/assign', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'invalid task id' }); return; }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) { res.status(404).json({ error: 'task not found' }); return; }
  if (task.requestorId !== user.userId && user.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  if (task.status !== 'pending') {
    res.status(400).json({ error: 'task already assigned' }); return;
  }

  const nodeId = parseInt(req.body.nodeId);
  if (isNaN(nodeId)) { res.status(400).json({ error: 'invalid node id' }); return; }

  const node = await prisma.node.findUnique({ where: { id: nodeId } });
  if (!node) { res.status(404).json({ error: 'node not found' }); return; }
  if (node.status !== 'online') { res.status(400).json({ error: 'node is offline' }); return; }
  if (node.stakeAmount < 1000) { res.status(400).json({ error: 'node does not meet minimum stake requirement' }); return; }

  const updated = await prisma.task.update({
    where: { id },
    data: { workerId: node.id, status: 'assigned' },
  });
  res.json(updated);
});

tasksRouter.post('/:id/proof', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'invalid id' }); return; }

  const task = await prisma.task.findUnique({
    where: { id },
    include: { worker: true },
  });
  if (!task) { res.status(404).json({ error: 'task not found' }); return; }
  if (!task.worker) { res.status(400).json({ error: 'no worker assigned' }); return; }

  const user = (req as any).user;
  if (user.role !== 'admin' && task.worker.userId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  if (task.status !== 'running') {
    res.status(400).json({ error: 'task must be running to submit proof' }); return;
  }

  const proofHash = crypto.createHash('sha256')
    .update(`${task.id}-${Date.now()}`)
    .digest('hex');

  const proof = await prisma.proof.create({
    data: {
      taskId: task.id,
      workerId: task.worker.id,
      proofType: task.proofType,
      proofData: req.body.proofData || proofHash,
      status: 'submitted',
    },
  });

  await prisma.task.update({
    where: { id },
    data: { status: 'proof_submitted', proofData: proof.proofData },
  });

  res.status(201).json(proof);
});

tasksRouter.post('/:id/verify', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'invalid id' }); return; }

  if (user.role !== 'admin' && user.userType !== 'attestor') {
    res.status(403).json({ error: 'only attestors can verify proofs' }); return;
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      worker: true,
      proofs: { where: { status: 'submitted' }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!task) { res.status(404).json({ error: 'task not found' }); return; }
  if (task.status !== 'proof_submitted') {
    res.status(400).json({ error: 'no proof to verify' }); return;
  }

  const latestProof = task.proofs[0];
  if (!latestProof) { res.status(400).json({ error: 'no proof found' }); return; }

  const accepted = req.body.accepted !== false;

  await prisma.proof.update({
    where: { id: latestProof.id },
    data: {
      status: accepted ? 'verified' : 'failed',
      attestorId: user.userId,
      verifiedAt: new Date(),
    },
  });

  const newStatus = accepted ? 'succeeded' : 'failed';
  const updated = await prisma.task.update({
    where: { id },
    data: { status: newStatus },
  });

  if (accepted && task.worker) {
    await prisma.node.update({
      where: { id: task.worker.id },
      data: {
        completedTasks: { increment: 1 },
        reputation: { increment: 1 },
      },
    });

    await prisma.earning.create({
      data: {
        userId: task.worker.userId,
        nodeId: task.worker.id,
        amount: task.rewardAmount,
        type: 'porw_reward',
        status: 'paid',
      },
    });
  } else if (!accepted && task.worker) {
    await prisma.node.update({
      where: { id: task.worker.id },
      data: {
        failedChallenges: { increment: 1 },
        reputation: Math.max(0, (task.worker.reputation ?? 0) - 5),
      },
    });
  }

  res.json(updated);
});

tasksRouter.post('/:id/status', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'invalid id' }); return; }

  const task = await prisma.task.findUnique({
    where: { id },
    include: { worker: true },
  });
  if (!task) { res.status(404).json({ error: 'task not found' }); return; }
  if (!task.worker) { res.status(400).json({ error: 'no worker assigned' }); return; }

  const user = (req as any).user;
  if (user.role !== 'admin' && task.worker.userId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }

  const status = req.body.status;
  // Workers can mark as running; succeeded/failed must go through proof+verify
  if (status !== 'running' && user.role !== 'admin') {
    res.status(400).json({ error: 'workers can only set status to running' }); return;
  }
  if (task.status !== 'assigned') {
    res.status(400).json({ error: 'task must be assigned to start' }); return;
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status: 'running' },
  });
  res.json(updated);
});

tasksRouter.get('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'invalid id' }); return; }
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      requestor: { select: { id: true, username: true } },
      worker: { select: { id: true, name: true, gpuType: true, reputation: true } },
      proofs: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!task) { res.status(404).json({ error: 'task not found' }); return; }
  if (user.role !== 'admin' && task.requestorId !== user.userId) {
    res.status(403).json({ error: 'forbidden' }); return;
  }
  res.json(task);
});

tasksRouter.get('/stats/overview', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const where = user.role === 'admin' ? {} : { requestorId: user.userId };

  const [total, byStatus, activeWorkers] = await Promise.all([
    prisma.task.aggregate({ where, _count: true }),
    prisma.task.groupBy({ by: ['status'], where, _count: true }),
    prisma.node.count({ where: { status: 'online' } }),
  ]);

  const statusBreakdown = Object.fromEntries(byStatus.map(s => [s.status, s._count]));

  res.json({
    total: total._count,
    statusBreakdown,
    activeWorkers,
  });
});
