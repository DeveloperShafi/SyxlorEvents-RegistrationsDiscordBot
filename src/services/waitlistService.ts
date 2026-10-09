import { prisma } from '../database/prisma.js';
import type { RegistrationInput } from '../types/index.js';
import { logger } from '../lib/logger.js';

function buildRegistrationCode(): string {
  return `REG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function submitRegistration(input: RegistrationInput) {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });

  if (!event) {
    throw new Error('Event not found');
  }

  const existing = await prisma.registration.findUnique({
    where: {
      eventId_discordUserId: {
        eventId: input.eventId,
        discordUserId: input.discordUserId,
      },
    },
  });

  if (existing) {
    throw new Error('This user is already registered for this event.');
  }

  const registration = await prisma.registration.create({
    data: {
      registrationId: buildRegistrationCode(),
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
      metadata: {
        reason,
      },
    },
  });

  return updated;
}

export async function cancelRegistration(registrationId: string, actorDiscordId: string) {
  const current = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!current) {
    throw new Error('Registration not found.');
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: actorDiscordId,
    },
  });

  await prisma.auditLog.create({
    data: {
      registrationId: updated.id,
      eventId: updated.eventId,
      actorDiscordId: actorDiscordId,
      actorType: 'USER',
      action: 'REGISTRATION_CANCELLED',
      previousState: current.status,
      newState: 'CANCELLED',
      metadata: {
        cancelledBy: actorDiscordId,
      },
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
  return prisma.registration.findUnique({
    where: { id: registrationId },
  });
}

export async function listRegistrations(eventId: string) {
  return prisma.registration.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  });
}
