import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? '',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? '',
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  STAFF_ROLE_ID: process.env.STAFF_ROLE_ID ?? '',
};

export function requireEnv(name: keyof typeof env): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
