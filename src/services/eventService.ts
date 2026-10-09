import { prisma } from '../database/prisma.js';
import type { EventCreateInput } from '../types/index.js';
import { logger } from '../lib/logger.js';

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

export async function findEventByNameOrPublicId(search: string) {
  return prisma.event.findFirst({
    where: {
      OR: [{ name: search }, { publicId: search }],
    },
  });
}

export async function openEvent(eventId: string) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: 'REGISTRATION_OPEN',
      updatedAt: new Date(),
    },
  });
}

export async function closeEvent(eventId: string) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: 'REGISTRATION_CLOSED',
      updatedAt: new Date(),
    },
  });
}

export async function setEventStatus(eventId: string, status: string) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: status as never,
      updatedAt: new Date(),
    },
  });
}
