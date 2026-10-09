import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '../database/prisma.js';

export const myRegistrationCommand = {
  data: new SlashCommandBuilder()
    .setName('my-registration')
    .setDescription('Check your registration status.')
    .addStringOption((option) =>
      option.setName('event-name').setDescription('Event name or ID').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const eventName = interaction.options.getString('event-name', true);
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ name: eventName }, { publicId: eventName }],
      },
    });

    if (!event) {
      await interaction.reply({ content: 'No event matched that name or ID.', ephemeral: true });
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
        content: `You are not registered for ${event.name}.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Registration Status')
      .setColor(0x00ae86)
      .addFields(
        { name: 'Event', value: event.name, inline: true },
        { name: 'Registration ID', value: registration.registrationId, inline: true },
        { name: 'Status', value: registration.status, inline: true },
        { name: 'Minecraft Username', value: registration.minecraftUsername, inline: true },
        { name: 'Version', value: registration.minecraftVersion, inline: true },
        { name: 'Mod Loader', value: registration.modLoader ?? 'N/A', inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
