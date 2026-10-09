import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { prisma } from '../database/prisma.js';
import { getPublicEventEmbed } from '../services/publicDisplayService.js';

export const eventInfoCommand = {
  data: new SlashCommandBuilder()
    .setName('event-info')
    .setDescription('Show the public information card for an event.')
    .addStringOption((option) =>
      option.setName('event').setDescription('Event name or public ID').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { name: interaction.options.getString('event', true) },
          { publicId: interaction.options.getString('event', true) },
        ],
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
