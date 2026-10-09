import { prisma } from '../database/prisma.js';

export async function addToWaitlist(registrationId: string) {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });

  if (!registration) {
    throw new Error('Registration not found');
  }

  const waitlistEntries = await prisma.registration.findMany({
    where: {
      eventId: registration.eventId,
      status: 'WAITLISTED',
    },
    orderBy: { createdAt: 'asc' },
  });

  return prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'WAITLISTED',
      waitlistPosition: waitlistEntries.length + 1,
    },
  });
}

export async function promoteNextWaitlistMember(eventId: string) {
  const next = await prisma.registration.findFirst({
    where: {
      eventId,
      status: 'WAITLISTED',
    },
    orderBy: {
      waitlistPosition: 'asc',
    },
  });

  if (!next) {
    return null;
  }

  return prisma.registration.update({
    where: { id: next.id },
    data: {
      status: 'APPROVED',
      waitlistPosition: null,
    },
  });
}
