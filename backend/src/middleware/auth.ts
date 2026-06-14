import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ethercoin-dev-secret';

export interface AuthPayload {
  userId: number;
  username: string;
  role: string;
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing token' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}
