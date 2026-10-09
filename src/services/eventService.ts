import { prisma } from '../database/prisma.js';
import type { EventCreateInput, RegistrationInput } from '../types/index.js';
import { logger } from '../lib/logger.js';

function buildRegistrationCode(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REG-${random}`;
}

export async function createEvent(input: EventCreateInput) {
  const event = await prisma.event.create({
    data: {
      name: input.name,
      description: input.description,
      eventType: (input.eventType ?? 'CUSTOM') as never,
      playerCapacity: input.playerCapacity ?? 100,
      teamCapacity: input.teamCapacity ?? 0,
      teamSize: input.teamSize ?? 1,
      minecraftEdition: input.minecraftEdition ?? ['Java'],
      minecraftVersions: input.minecraftVersions ?? ['1.20.4', '1.21.x'],
      clients: input.clients ?? ['Vanilla', 'Lunar', 'Fabric'],
      modLoaders: input.modLoaders ?? ['Fabric', 'Forge', 'Vanilla'],
      rules: input.rules ?? ['No hacks', 'Respect staff'],
      registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : null,
      eventStartAt: input.eventStartAt ? new Date(input.eventStartAt) : null,
      timezone: input.timezone ?? 'UTC',
      approvalRequired: input.approvalRequired ?? true,
      waitlistEnabled: input.waitlistEnabled ?? true,
      publicDisplay: input.publicDisplay ?? true,
      status: 'REGISTRATION_OPEN',
    },
  });

  logger.info('Event created', { eventId: event.id, name: event.name });
  return event;
}

export async function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: true,
      teams: true,
    },
  });
}

export async function getAllEvents() {
  return prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
  });
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
    throw new Error('A registration for this user already exists for this event.');
  }

  const registrationId = buildRegistrationCode();

  const registration = await prisma.registration.create({
    data: {
      registrationId,
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

  return registration;
}

export async function approveRegistration(registrationId: string, actorDiscordId: string) {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!registration) {
    throw new Error('Registration not found');
  }

  if (registration.status === 'APPROVED') {
    throw new Error('Registration already approved');
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: actorDiscordId,
      approvalReason: 'Approved by staff',
    },
  });

  await prisma.auditLog.create({
    data: {
      registrationId: registration.id,
      eventId: registration.eventId,
      actorDiscordId: actorDiscordId,
      actorType: 'STAFF',
      action: 'REGISTRATION_APPROVED',
      previousState: registration.status,
      newState: 'APPROVED',
      metadata: {
        approvedBy: actorDiscordId,
      },
    },
  });

  return updated;
}

export async function rejectRegistration(registrationId: string, actorDiscordId: string, reason: string) {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!registration) {
    throw new Error('Registration not found');
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
      registrationId: registration.id,
      eventId: registration.eventId,
      actorDiscordId: actorDiscordId,
      actorType: 'STAFF',
      action: 'REGISTRATION_REJECTED',
      previousState: registration.status,
      newState: 'REJECTED',
      metadata: {
        reason,
      },
    },
  });

  return updated;
}

export async function createWaitlistRegistration(registrationId: string) {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!registration) {
    throw new Error('Registration not found');
  }

  const waitlistedEntries = await prisma.registration.findMany({
    where: {
      eventId: registration.eventId,
      status: 'WAITLISTED',
    },
    orderBy: { createdAt: 'asc' },
  });

  const position = waitlistedEntries.length + 1;

  return prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'WAITLISTED',
      waitlistPosition: position,
    },
  });
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
