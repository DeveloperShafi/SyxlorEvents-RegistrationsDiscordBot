import { prisma } from '../database/prisma.js';
import { logger } from '../lib/logger.js';

export async function submitRegistration(input: {
  eventId: string;
  discordUserId: string;
  discordUsername: string;
  minecraftUsername: string;
  minecraftVersion: string;
  client?: string;
  modLoader?: string;
  minecraftEdition?: string;
  additionalInformation?: string | null;
  teamId?: string | null;
}) {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });

  if (!event) {
    throw new Error('Event not found');
  }

  const duplicate = await prisma.registration.findUnique({
    where: {
      eventId_discordUserId: {
        eventId: input.eventId,
        discordUserId: input.discordUserId,
      },
    },
  });

  if (duplicate) {
    throw new Error('This user is already registered for this event.');
  }

  const registration = await prisma.registration.create({
    data: {
      registrationId: `REG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      eventId: input.eventId,
      discordUserId: input.discordUserId,
      discordUsername: input.discordUsername,
      minecraftUsername: input.minecraftUsername,
      minecraftVersion: input.minecraftVersion,
      client: input.client ?? 'Unknown',
      modLoader: input.modLoader ?? 'Unknown',
      minecraftEdition: input.minecraftEdition ?? 'Java',
      additionalInformation: input.additionalInformation ?? null,
      teamId: input.teamId ?? null,
      status: event.approvalRequired ? 'UNDER_REVIEW' : 'APPROVED',
    },
  });

  await prisma.auditLog.create({
    data: {
      eventId: input.eventId,
      registrationId: registration.id,
      actorDiscordId: input.discordUserId,
      actorType: 'USER',
      action: 'REGISTRATION_SUBMITTED',
      previousState: 'NONE',
      newState: registration.status,
      metadata: {
        registrationId: registration.registrationId,
      },
    },
  });

  logger.info('Registration submitted', {
    eventId: input.eventId,
    registrationId: registration.registrationId,
    discordUserId: input.discordUserId,
  });

  return registration;
}

export async function approveRegistration(registrationId: string, actorDiscordId: string) {
  const current = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!current) {
    throw new Error('Registration not found.');
  }

  if (current.status === 'APPROVED') {
    throw new Error('This registration is already approved.');
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: actorDiscordId,
    },
  });

  await prisma.auditLog.create({
    data: {
      registrationId: updated.id,
      eventId: updated.eventId,
      actorDiscordId: actorDiscordId,
      actorType: 'STAFF',
      action: 'REGISTRATION_APPROVED',
      previousState: current.status,
      newState: 'APPROVED',
      metadata: {
        approvedBy: actorDiscordId,
      },
    },
  });

  return updated;
}

export async function rejectRegistration(registrationId: string, actorDiscordId: string, reason: string) {
  const current = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!current) {
    throw new Error('Registration not found.');
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  });

  await prisma.auditLog.create({
    data: {
      registrationId: updated.id,
      eventId: updated.eventId,
      actorDiscordId: actorDiscordId,
      actorType: 'STAFF',
      action: 'REGISTRATION_REJECTED',
      previousState: current.status,
      newState: 'REJECTED',
      metadata: { reason },
    },
  });

  return updated;
}

export async function getRegistrationByUser(eventId: string, discordUserId: string) {
  return prisma.registration.findUnique({
    where: {
      eventId_discordUserId: {
        eventId,
        discordUserId,
      },
    },
  });
}

export async function getRegistrationById(registrationId: string) {
  return prisma.registration.findUnique({ where: { id: registrationId } });
}

export async function listRegistrations(eventId: string) {
  return prisma.registration.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  });
}
