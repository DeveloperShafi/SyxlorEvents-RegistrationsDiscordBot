import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { findEventByNameOrPublicId, openEvent, closeEvent } from '../services/eventService.js';
import { approveRegistration, rejectRegistration } from '../services/registrationService.js';
import { ensureStaffAccess } from '../services/staffService.js';

export const staffCommands = [
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

      const search = interaction.options.getString('event', true);
      const event = await findEventByNameOrPublicId(search);

      if (!event) {
        await interaction.reply({ content: 'Event not found.', ephemeral: true });
        return;
      }

      await openEvent(event.id);
      await interaction.reply({
        content: `Registration for ${event.name} is now open.`,
        ephemeral: true,
      });
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

      const search = interaction.options.getString('event', true);
      const event = await findEventByNameOrPublicId(search);

      if (!event) {
        await interaction.reply({ content: 'Event not found.', ephemeral: true });
        return;
      }

      await closeEvent(event.id);
      await interaction.reply({
        content: `Registration for ${event.name} is now closed.`,
        ephemeral: true,
      });
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

      const registrationId = interaction.options.getString('registration-id', true);
      const registration = await approveRegistration(registrationId, interaction.user.id);

      await interaction.reply({
        content: `Registration ${registration.registrationId} approved.`,
        ephemeral: true,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('reject-registration')
      .setDescription('Reject a pending registration.')
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

      const registrationId = interaction.options.getString('registration-id', true);
      const reason = interaction.options.getString('reason', true);
      const registration = await rejectRegistration(registrationId, interaction.user.id, reason);

      await interaction.reply({
        content: `Registration ${registration.registrationId} rejected.`,
        ephemeral: true,
      });
    },
  },
];
