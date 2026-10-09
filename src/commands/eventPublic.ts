import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { prisma } from '../database/prisma.js';
import { getPublicEventEmbed } from '../services/publicDisplayService.js';
import { ensureStaffAccess } from '../services/staffService.js';

export const eventInfoCommand = {
  data: new SlashCommandBuilder()
    .setName('event-info')
    .setDescription('Display a public event registration card.')
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

    const embed = await getPublicEventEmbed(event.id);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export const eventPublicSummaryCommand = {
  data: new SlashCommandBuilder()
    .setName('event-summary')
    .setDescription('Show the public summary for an event.')
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

    const embed = new EmbedBuilder()
      .setTitle('📣 EVENT SUMMARY')
      .setDescription(event.description)
      .setColor(0x5b6cff)
      .addFields(
        { name: 'Name', value: event.name, inline: true },
        { name: 'Status', value: event.status, inline: true },
        { name: 'Registration', value: event.status === 'REGISTRATION_OPEN' ? 'Open' : 'Closed', inline: true },
        { name: 'Public', value: event.publicDisplay ? 'Visible' : 'Hidden', inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export const staffEventSummaryCommand = {
  data: new SlashCommandBuilder()
    .setName('event-summary-staff')
    .setDescription('Show internal event summary for staff.')
    .addStringOption((option) =>
      option.setName('event').setDescription('Event name or public ID').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await ensureStaffAccess(interaction))) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

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

    const count = await prisma.registration.count({
      where: { eventId: event.id, status: 'APPROVED' },
    });

    const embed = new EmbedBuilder()
      .setTitle('🛠️ STAFF EVENT SUMMARY')
      .setColor(0xf5b700)
      .addFields(
        { name: 'Name', value: event.name, inline: true },
        { name: 'Public ID', value: event.publicId, inline: true },
        { name: 'Status', value: event.status, inline: true },
        { name: 'Approved', value: String(count), inline: true },
        { name: 'Capacity', value: String(event.playerCapacity || 'Unlimited'), inline: true },
        { name: 'Review Required', value: String(event.approvalRequired), inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
