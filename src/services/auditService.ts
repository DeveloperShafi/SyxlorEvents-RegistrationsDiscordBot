import { SyxlorClient } from './discord/client.js';
import { prisma } from './database/prisma.js';
import { logger } from './lib/logger.js';
import { env, requireEnv } from './config/env.js';

async function main() {
  requireEnv('DATABASE_URL');
  requireEnv('DISCORD_TOKEN');
  requireEnv('DISCORD_CLIENT_ID');

  logger.info('Starting Syxlor Events Registrations bot', {
    environment: env.NODE_ENV,
  });

  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', { error });
    process.exit(1);
  }

  const client = new SyxlorClient();
  await client.start();

  process.on('SIGINT', async () => {
    logger.info('Shutting down');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal startup error', { error });
  process.exit(1);
});

