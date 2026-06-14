import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { nodesRouter } from './routes/nodes.js';
import { earningsRouter } from './routes/earnings.js';
import { dashboardRouter } from './routes/dashboard.js';
import { tasksRouter } from './routes/tasks.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/earnings', earningsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/tasks', tasksRouter);

app.get('/', (_req, res) => {
  res.redirect(302, process.env.FRONTEND_URL || 'http://localhost:5173');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
