import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const nodeWhere = user.role === 'admin' ? {} : { userId: user.userId };
  const historyWhere = user.role === 'admin' ? {} : { node: { userId: user.userId } };

  const [nodeStats, earningStats, recentHistory, taskStats] = await Promise.all([
    prisma.node.aggregate({
      where: nodeWhere,
      _count: true,
      _sum: { hashrate: true, stakeAmount: true, gpuCount: true },
    }),
    prisma.earning.aggregate({
      where: { ...nodeWhere, status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.hashrateHistory.findMany({
      where: historyWhere,
      orderBy: { recordedAt: 'desc' },
      take: 168,
    }),
    prisma.task.aggregate({
      where: user.role === 'admin' ? {} : { requestorId: user.userId },
      _count: true,
    }),
  ]);

  const totalHashrate = nodeStats._sum.hashrate ?? 0;
  const totalNodes = nodeStats._count;
  const totalStaked = nodeStats._sum.stakeAmount ?? 0;
  const totalGpus = nodeStats._sum.gpuCount ?? 0;
  const totalEarnings = earningStats._sum.amount ?? 0;
  const totalTasks = taskStats._count;

  const hashrateSeries = recentHistory
    .reverse()
    .map(h => ({ time: h.recordedAt.toISOString(), hashrate: h.hashrate }));

  const byStatus = await prisma.node.groupBy({
    by: ['status'],
    where: nodeWhere,
    _count: true,
  });
  const statusBreakdown = Object.fromEntries(byStatus.map(s => [s.status, s._count]));

  const taskByStatus = await prisma.task.groupBy({
    by: ['status'],
    where: user.role === 'admin' ? {} : { requestorId: user.userId },
    _count: true,
  });
  const taskStatusBreakdown = Object.fromEntries(taskByStatus.map(s => [s.status, s._count]));

  const topWorkers = await prisma.node.findMany({
    where: { ...nodeWhere, status: 'online' },
    orderBy: { reputation: 'desc' },
    take: 5,
    select: { id: true, name: true, gpuType: true, reputation: true, completedTasks: true, hashrate: true },
  });

  res.json({
    totalHashrate,
    totalNodes,
    totalStaked,
    totalGpus,
    totalEarnings,
    totalTasks,
    hashrateSeries,
    statusBreakdown,
    taskStatusBreakdown,
    topWorkers,
  });
});

dashboardRouter.get('/nodes/status', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const nodes = await prisma.node.findMany({
    where: user.role === 'admin' ? {} : { userId: user.userId },
    select: { id: true, name: true, status: true, hashrate: true, gpuType: true, reputation: true, lastSeen: true },
  });
  res.json(nodes);
});
