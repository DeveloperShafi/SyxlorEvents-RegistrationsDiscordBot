import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { prisma } from '../database/prisma.js';

export const teamCreateCommand = {
  data: new SlashCommandBuilder()
    .setName('team-create')
    .setDescription('Create a team for a registered event.')
    .addStringOption((option) =>
      option.setName('event').setDescription('Event name or public ID').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('team-name').setDescription('Your team name').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const eventName = interaction.options.getString('event', true);
    const teamName = interaction.options.getString('team-name', true);

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ name: eventName }, { publicId: eventName }],
      },
    });

    if (!event) {
      await interaction.reply({ content: 'Event not found.', ephemeral: true });
      return;
    }

    const registration = await prisma.registration.findUnique({
      where: {
        eventId_discordUserId: {
          eventId: event.id,
          discordUserId: interaction.user.id,
        },
      },
    });

    if (!registration) {
      await interaction.reply({
        content: `You must register for ${event.name} before creating a team.`,
        ephemeral: true,
      });
      return;
    }

    const existingTeam = await prisma.team.findFirst({
      where: {
        eventId: event.id,
        captainId: interaction.user.id,
      },
    });

    if (existingTeam) {
      await interaction.reply({
        content: `You already created a team for ${event.name}: ${existingTeam.name}.`,
        ephemeral: true,
      });
      return;
    }

    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        captainId: interaction.user.id,
        name: teamName,
        status: 'PENDING',
      },
    });

    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        teamId: team.id,
      },
    });

    await interaction.reply({
      content: `Team created for ${event.name}: **${team.name}**.`,
      ephemeral: true,
    });
  },
};

export const teamListCommand = {
  data: new SlashCommandBuilder()
    .setName('team-list')
    .setDescription('List teams for an event.')
    .addStringOption((option) =>
      option.setName('event').setDescription('Event name or public ID').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const eventName = interaction.options.getString('event', true);
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ name: eventName }, { publicId: eventName }],
      },
    });

    if (!event) {
      await interaction.reply({ content: 'Event not found.', ephemeral: true });
      return;
    }

    const teams = await prisma.team.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'asc' },
    });

    const teamSummary = teams.length > 0 ? teams.map((team) => `• ${team.name} (Captain: <@${team.captainId}>)`).join('\n') : 'No teams created yet.';

    await interaction.reply({
      content: `Teams for **${event.name}**:\n${teamSummary}`,
      ephemeral: true,
    });
  },
};
