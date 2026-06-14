import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const earningsRouter = Router();

earningsRouter.use(authMiddleware);

earningsRouter.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const earnings = await prisma.earning.findMany({
    where: user.role === 'admin' ? {} : { userId: user.userId },
    include: { node: { select: { name: true, gpuType: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(earnings);
});

earningsRouter.get('/summary', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const where = user.role === 'admin' ? {} : { userId: user.userId };

  const [total, pending, paid, daily] = await Promise.all([
    prisma.earning.aggregate({ where, _sum: { amount: true } }),
    prisma.earning.aggregate({ where: { ...where, status: 'pending' }, _sum: { amount: true } }),
    prisma.earning.aggregate({ where: { ...where, status: 'paid' }, _sum: { amount: true } }),
    prisma.earning.aggregate({
      where: { ...where, createdAt: { gte: new Date(Date.now() - 86400000) } },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    total: total._sum.amount ?? 0,
    pending: pending._sum.amount ?? 0,
    paid: paid._sum.amount ?? 0,
    daily: daily._sum.amount ?? 0,
  });
});
