import { prisma } from '../database/prisma.js';

export async function getApprovedRegistrationCount(eventId: string): Promise<number> {
  return prisma.registration.count({
    where: {
      eventId,
      status: 'APPROVED',
    },
  });
}

export async function getWaitlistCount(eventId: string): Promise<number> {
  return prisma.registration.count({
    where: {
      eventId,
      status: 'WAITLISTED',
    },
  });
}

export async function validateEventState(eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new Error('Event not found.');
  }

  if (event.status !== 'REGISTRATION_OPEN') {
    throw new Error(`Event is not accepting registrations right now (${event.status}).`);
  }

  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    throw new Error('Registration deadline has passed for this event.');
  }
}

export async function evaluateRegistrationPlacement(eventId: string): Promise<{
  status: 'APPROVED' | 'UNDER_REVIEW' | 'WAITLISTED';
  waitlistPosition: number | null;
}> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new Error('Event not found.');
  }

  const approvedCount = await getApprovedRegistrationCount(eventId);

  if (event.playerCapacity > 0 && approvedCount >= event.playerCapacity) {
    if (!event.waitlistEnabled) {
      throw new Error('This event is full and waitlisting is disabled.');
    }

    const waitlistPosition = (await getWaitlistCount(eventId)) + 1;
    return {
      status: 'WAITLISTED',
      waitlistPosition,
    };
  }

  return {
    status: event.approvalRequired ? 'UNDER_REVIEW' : 'APPROVED',
    waitlistPosition: null,
  };
}
