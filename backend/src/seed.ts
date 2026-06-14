import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const rng = seededRandom(42);

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ethercoin.com',
      password,
      role: 'admin',
      userType: 'attestor',
      walletAddr: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
  });

  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      password,
      role: 'user',
      userType: 'requestor',
      walletAddr: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    },
  });

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      password,
      role: 'user',
      userType: 'worker',
    },
  });

  const gpuTypes = [
    { type: 'NVIDIA RTX 4090', hr: 82, vram: 24 },
    { type: 'NVIDIA RTX 4080', hr: 48, vram: 16 },
    { type: 'NVIDIA A100', hr: 312, vram: 80 },
    { type: 'NVIDIA RTX 3090', hr: 35, vram: 24 },
    { type: 'AMD RX 7900 XTX', hr: 61, vram: 24 },
    { type: 'NVIDIA RTX 4070', hr: 29, vram: 12 },
  ];

  const locations = ['Tokyo', 'Hong Kong', 'Singapore', 'Frankfurt', 'London', 'New York', 'San Francisco', 'Seoul'];

  const nodeData = [
    { user: admin, count: 4 },
    { user: alice, count: 6 },
    { user: bob, count: 3 },
  ];

  const allNodes: Awaited<ReturnType<typeof prisma.node.create>>[] = [];

  for (const { user, count } of nodeData) {
    for (let i = 0; i < count; i++) {
      const gpu = gpuTypes[Math.floor(rng() * gpuTypes.length)];
      const hr = gpu.hr + (rng() * 10 - 5);
      const node = await prisma.node.create({
        data: {
          userId: user.id,
          name: `${user.username}-node-${i + 1}`,
          gpuType: gpu.type,
          gpuCount: Math.floor(rng() * 4) + 1,
          hashrate: hr,
          vram: gpu.vram,
          status: rng() > 0.2 ? 'online' : 'offline',
          location: locations[Math.floor(rng() * locations.length)],
          ip: `10.0.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}`,
          stakeAmount: 1000 + Math.floor(rng() * 49000),
          reputation: Math.floor(rng() * 100),
          completedTasks: Math.floor(rng() * 50),
          failedChallenges: Math.floor(rng() * 5),
          lastSeen: new Date(),
        },
      });
      allNodes.push(node);

      for (let d = 7 * 24 * 6; d >= 0; d -= 6) {
        const time = new Date(Date.now() - d * 600000);
        await prisma.hashrateHistory.create({
          data: {
            nodeId: node.id,
            hashrate: hr * (0.85 + rng() * 0.3),
            recordedAt: time,
          },
        });
      }

      for (let d = 30; d >= 0; d -= 1) {
        const day = new Date(Date.now() - d * 86400000);
        const amount = parseFloat((hr * (0.5 + rng())).toFixed(4));
        await prisma.earning.create({
          data: {
            userId: user.id,
            nodeId: node.id,
            amount,
            type: d % 7 === 0 ? 'completion_bonus' : 'compute_reward',
            status: rng() > 0.1 ? 'paid' : 'pending',
            createdAt: day,
          },
        });
      }
    }
  }

  // Seed tasks with lifecycle data
  const onlineNodes = allNodes.filter(n => n.status === 'online');
  const taskTemplates = [
    { title: 'LLM Fine-tuning — LLaMA 7B', desc: 'Fine-tune LLaMA 7B on custom dataset, 4x A100 required', gpuReq: 'A100 80GB' },
    { title: 'Batch Inference — Stable Diffusion', desc: 'Generate 10K images with SDXL batch pipeline', gpuReq: 'RTX 4090 24GB' },
    { title: 'Model Training — ResNet-50', desc: 'Image classification training on ImageNet subset', gpuReq: 'A100 80GB' },
    { title: 'Video Processing — Transcoding', desc: 'Transcode 500GB of video content using FFmpeg GPU', gpuReq: 'RTX 4080+' },
    { title: 'ZK Proof Generation', desc: 'Generate zk-SNARK proofs for off-chain computation', gpuReq: 'Any' },
    { title: 'Text Embedding — Batch 100K', desc: 'Generate embeddings for 100K documents using BERT', gpuReq: 'RTX 3090+' },
  ];

  const taskStatuses: { status: string; prob: number }[] = [
    { status: 'succeeded', prob: 0.4 },
    { status: 'pending', prob: 0.2 },
    { status: 'assigned', prob: 0.1 },
    { status: 'running', prob: 0.1 },
    { status: 'failed', prob: 0.1 },
    { status: 'disputed', prob: 0.05 },
    { status: 'proof_submitted', prob: 0.05 },
  ];

  for (let i = 0; i < 20; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const requestor = [admin, alice, bob][Math.floor(rng() * 3)];
    const worker = rng() > 0.3 && onlineNodes.length > 0
      ? onlineNodes[Math.floor(rng() * onlineNodes.length)]
      : null;

    let roll = rng();
    let status = 'pending';
    for (const s of taskStatuses) {
      if (roll < s.prob) { status = s.status; break; }
      roll -= s.prob;
    }
    if (!worker && ['assigned', 'running', 'proof_submitted', 'succeeded'].includes(status)) {
      status = 'pending';
    }

    const taskHash = crypto.createHash('sha256')
      .update(`${requestor.id}-${template.title}-${i}`)
      .digest('hex')
      .substring(0, 16);

    const rewardAmount = parseFloat((5 + rng() * 45).toFixed(2));
    const daysAgo = Math.floor(rng() * 14);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    const task = await prisma.task.create({
      data: {
        requestorId: requestor.id,
        workerId: worker?.id || null,
        title: template.title,
        description: template.desc,
        taskHash,
        proofType: (['zk', 'tee', 'hybrid'] as const)[Math.floor(rng() * 3)],
        status,
        rewardAmount,
        lockedAmount: rewardAmount,
        gpuRequirement: template.gpuReq,
        deadline: new Date(Date.now() + (7 - daysAgo) * 86400000),
        createdAt,
      },
    });

    // Add proofs for succeeded tasks
    if (status === 'succeeded' && worker) {
      const proofData = crypto.createHash('sha256')
        .update(`${task.id}-proof-${i}`)
        .digest('hex');

      await prisma.proof.create({
        data: {
          taskId: task.id,
          workerId: worker.id,
          attestorId: admin.id,
          proofType: task.proofType,
          proofData,
          status: 'verified',
          verifiedAt: new Date(Date.now() - (daysAgo - 1) * 86400000),
        },
      });

      await prisma.earning.create({
        data: {
          userId: worker.userId,
          nodeId: worker.id,
          amount: task.rewardAmount,
          type: 'porw_reward',
          status: 'paid',
          createdAt: new Date(Date.now() - (daysAgo - 1) * 86400000),
        },
      });
    }

    // Add unverified proof for proof_submitted tasks
    if (status === 'proof_submitted' && worker) {
      await prisma.proof.create({
        data: {
          taskId: task.id,
          workerId: worker.id,
          proofType: task.proofType,
          proofData: crypto.createHash('sha256').update(`${task.id}-unverified`).digest('hex'),
          status: 'submitted',
        },
      });
    }
  }

  console.log('Seed completed — users, nodes, history, earnings, tasks, proofs');
}

main().catch(console.error).finally(() => prisma.$disconnect());
