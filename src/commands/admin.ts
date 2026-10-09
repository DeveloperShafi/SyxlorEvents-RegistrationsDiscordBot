import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database/prisma.js';
import { findEventByNameOrPublicId, openEvent, closeEvent } from '../services/eventService.js';
import { ensureStaffAccess } from '../services/staffService.js';
import { approveRegistration, rejectRegistration, submitRegistration } from '../services/registrationService.js';
import { exportRegistrations } from '../services/exportService.js';

export const eventStatusCommand = {
  data: new SlashCommandBuilder()
    .setName('event-status')
    .setDescription('Check the current status of an event.')
    .addStringOption((option) =>
      option.setName('event').setDescription('Event name or public ID').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await ensureStaffAccess(interaction))) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const event = await findEventByNameOrPublicId(interaction.options.getString('event', true));

    if (!event) {
      await interaction.reply({ content: 'Event not found.', ephemeral: true });
      return;
    }

    const approvedCount = await prisma.registration.count({
      where: { eventId: event.id, status: 'APPROVED' },
    });

    await interaction.reply({
      content: `Event: ${event.name}\nStatus: ${event.status}\nCapacity: ${approvedCount}/${event.playerCapacity || '∞'}\nWaitlist: ${event.waitlistEnabled ? 'Enabled' : 'Disabled'}`,
      ephemeral: true,
    });
  },
};

export const exportRegistrationsCommand = {
  data: new SlashCommandBuilder()
    .setName('export-registrations')
    .setDescription('Export event registrations.')
    .addStringOption((option) =>
      option.setName('event').setDescription('Event name or public ID').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('format')
        .setDescription('Export format')
        .setRequired(true)
        .addChoices(
          { name: 'CSV', value: 'csv' },
          { name: 'JSON', value: 'json' },
          { name: 'Markdown', value: 'markdown' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await ensureStaffAccess(interaction))) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const event = await findEventByNameOrPublicId(interaction.options.getString('event', true));
    const format = interaction.options.getString('format', true) as 'csv' | 'json' | 'markdown';

    if (!event) {
      await interaction.reply({ content: 'Event not found.', ephemeral: true });
      return;
    }

    const csv = await exportRegistrations(event.id, format);
    await interaction.reply({
      content: `Export generated for ${event.name}:\n\n\`\`\`\n${csv.slice(0, 1800)}\n\`\`\``,
      ephemeral: true,
    });
  },
};

export const adminControlCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('event-open')
      .setDescription('Open registration for an event.')
      .addStringOption((option) =>
        option.setName('event').setDescription('Event name or public ID').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!(await ensureStaffAccess(interaction))) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }

      const event = await findEventByNameOrPublicId(interaction.options.getString('event', true));
      if (!event) {
        await interaction.reply({ content: 'Event not found.', ephemeral: true });
        return;
      }

      await openEvent(event.id);
      await interaction.reply({ content: `Registration for ${event.name} is now open.`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('event-close')
      .setDescription('Close registration for an event.')
      .addStringOption((option) =>
        option.setName('event').setDescription('Event name or public ID').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!(await ensureStaffAccess(interaction))) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }

      const event = await findEventByNameOrPublicId(interaction.options.getString('event', true));
      if (!event) {
        await interaction.reply({ content: 'Event not found.', ephemeral: true });
        return;
      }

      await closeEvent(event.id);
      await interaction.reply({ content: `Registration for ${event.name} is now closed.`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('approve-registration')
      .setDescription('Approve a pending registration.')
      .addStringOption((option) =>
        option.setName('registration-id').setDescription('Registration ID').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!(await ensureStaffAccess(interaction))) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }

      const registration = await approveRegistration(
        interaction.options.getString('registration-id', true),
        interaction.user.id
      );

      await interaction.reply({
        content: `Registration ${registration.registrationId} was approved.`,
        ephemeral: true,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('reject-registration')
      .setDescription('Reject a registration.')
      .addStringOption((option) =>
        option.setName('registration-id').setDescription('Registration ID').setRequired(true)
      )
      .addStringOption((option) =>
        option.setName('reason').setDescription('Reason for rejection').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!(await ensureStaffAccess(interaction))) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }

      const registration = await rejectRegistration(
        interaction.options.getString('registration-id', true),
        interaction.user.id,
        interaction.options.getString('reason', true)
      );

      await interaction.reply({
        content: `Registration ${registration.registrationId} was rejected.`,
        ephemeral: true,
      });
    },
  },
  eventStatusCommand,
  exportRegistrationsCommand,
];
