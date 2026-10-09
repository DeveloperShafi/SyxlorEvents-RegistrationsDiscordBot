import { prisma } from '../database/prisma.js';
import { EmbedBuilder } from 'discord.js';

export async function getPublicEventEmbed(eventId: string): Promise<EmbedBuilder> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: true,
      teams: true,
    },
  });

  if (!event) {
    throw new Error('Event not found.');
  }

  const approvedCount = event.registrations.filter((registration) => registration.status === 'APPROVED').length;
  const waitlistCount = event.registrations.filter((registration) => registration.status === 'WAITLISTED').length;
  const availableSlots = event.playerCapacity > 0 ? Math.max(event.playerCapacity - approvedCount, 0) : 0;

  const embed = new EmbedBuilder()
    .setTitle('📝 EVENT REGISTRATION')
    .setDescription(event.description)
    .setColor(0x00ae86)
    .addFields(
      { name: 'Event', value: event.name, inline: true },
      { name: 'Status', value: event.status, inline: true },
      { name: 'Type', value: event.eventType, inline: true },
      { name: 'Players', value: `${approvedCount} / ${event.playerCapacity || '∞'}`, inline: true },
      { name: 'Available', value: String(availableSlots), inline: true },
      { name: 'Waitlist', value: String(waitlistCount), inline: true },
      { name: 'Deadline', value: event.registrationDeadline ? new Date(event.registrationDeadline).toUTCString() : 'Not set', inline: false },
      { name: 'Event Date', value: event.eventStartAt ? new Date(event.eventStartAt).toUTCString() : 'Not set', inline: false },
      { name: 'Requirements', value: event.rules.length > 0 ? event.rules.join(' • ') : 'No specific rules configured.', inline: false },
      { name: 'Minecraft Versions', value: event.minecraftVersions.length > 0 ? event.minecraftVersions.join(', ') : 'Not specified', inline: false },
      { name: 'Clients', value: event.clients.length > 0 ? event.clients.join(', ') : 'Not specified', inline: false }
    );

  return embed;
}
