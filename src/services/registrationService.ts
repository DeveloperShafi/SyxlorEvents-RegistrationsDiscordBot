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

  if (event.status !== 'REGISTRATION_OPEN') {
    throw new Error(`Event is not accepting registrations right now (${event.status}).`);
  }

  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    throw new Error('Registration deadline has passed.');
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

  const approvedCount = await prisma.registration.count({
    where: {
      eventId: input.eventId,
      status: 'APPROVED',
    },
  });

  let status: 'UNDER_REVIEW' | 'APPROVED' | 'WAITLISTED' = event.approvalRequired ? 'UNDER_REVIEW' : 'APPROVED';
  let waitlistPosition: number | null = null;

  if (event.playerCapacity > 0 && approvedCount >= event.playerCapacity) {
    if (!event.waitlistEnabled) {
      throw new Error('This event is full and waitlisting is disabled.');
    }

    status = 'WAITLISTED';
    waitlistPosition = (await prisma.registration.count({
      where: {
        eventId: input.eventId,
        status: 'WAITLISTED',
      },
    })) + 1;
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
      status,
      waitlistPosition,
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
        waitlistPosition,
      },
    },
  });

  logger.info('Registration submitted', {
    eventId: input.eventId,
    registrationId: registration.registrationId,
    discordUserId: input.discordUserId,
    status: registration.status,
  });

  return registration;
}

export async function approveRegistration(registrationId: string, actorDiscordId: string) {
  const current = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!current) {
    throw new Error('Registration not found.');
  }

  const event = await prisma.event.findUnique({ where: { id: current.eventId } });

  if (!event) {
    throw new Error('Event not found.');
  }

  const approvedCount = await prisma.registration.count({
    where: {
      eventId: current.eventId,
      status: 'APPROVED',
    },
  });

  if (event.playerCapacity > 0 && approvedCount >= event.playerCapacity && current.status !== 'APPROVED') {
    throw new Error('This event has reached capacity and cannot accept more approved registrations.');
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
