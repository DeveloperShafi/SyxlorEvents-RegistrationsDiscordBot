import { prisma } from '../database/prisma.js';

export async function createTeam(eventId: string, captainId: string, name: string) {
  return prisma.team.create({
    data: {
      eventId,
      captainId,
      name,
      status: 'PENDING',
    },
  });
}

export async function addTeamMember(teamId: string, registrationId: string, userDiscordId: string) {
  return prisma.teamMember.create({
    data: {
      teamId,
      registrationId,
      userDiscordId,
    },
  });
}

export async function getTeam(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: true,
      registrations: true,
    },
  });
}

