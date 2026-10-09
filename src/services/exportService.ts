import { prisma } from '../database/prisma.js';

export async function createAuditEvent(params: {
  eventId?: string;
  registrationId?: string;
  teamId?: string;
  actorDiscordId?: string;
  actorType?: string;
  action: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      eventId: params.eventId,
      registrationId: params.registrationId,
      teamId: params.teamId,
      actorDiscordId: params.actorDiscordId ?? null,
      actorType: params.actorType ?? 'SYSTEM',
      action: params.action as never,
      previousState: params.previousState ?? null,
      newState: params.newState ?? null,
      metadata: params.metadata ?? {},
    },
  });
}
