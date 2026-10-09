import { prisma } from '../database/prisma.js';
import type { EventCreateInput } from '../types/index.js';
import { logger } from '../lib/logger.js';

export async function createEvent(input: EventCreateInput) {
  const event = await prisma.event.create({
    data: {
      name: input.name,
      description: input.description,
      eventType: input.eventType as never,
      playerCapacity: input.playerCapacity ?? 100,
      teamCapacity: input.teamCapacity ?? 0,
      teamSize: input.teamSize ?? 1,
      minecraftEdition: input.minecraftEdition ?? ['Java'],
      minecraftVersions: input.minecraftVersions ?? ['1.20.4'],
      clients: input.clients ?? ['Vanilla'],
      modLoaders: input.modLoaders ?? ['Vanilla'],
      rules: input.rules ?? ['Be respectful and follow staff decisions.'],
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

export async function getEvent(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: true,
      teams: true,
    },
  });
}

export async function listEvents() {
  return prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function setStatus(eventId: string, status: string) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: status as never,
    },
  });
}
