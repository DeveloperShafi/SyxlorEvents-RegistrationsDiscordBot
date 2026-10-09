import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { prisma } from '../database/prisma.js';
import { getRegistrationByUser } from '../services/registrationService.js';

export const registerCommand = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register for an event.')
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
      await interaction.reply({
        content: 'No event matched that name or ID. Use the event name or public ID.',
        ephemeral: true,
      });
      return;
    }

    const existing = await getRegistrationByUser(event.id, interaction.user.id);
    if (existing) {
      await interaction.reply({
        content: `You are already registered for ${event.name} with ID ${existing.registrationId}.`,
        ephemeral: true,
      });
      return;
    }

    const modal = new ModalBuilder().setCustomId(`register:${event.id}`).setTitle(`Register for ${event.name}`);

    const minecraftUser = new TextInputBuilder()
      .setCustomId('minecraftUsername')
      .setLabel('Minecraft Username')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const minecraftVersion = new TextInputBuilder()
      .setCustomId('minecraftVersion')
      .setLabel('Minecraft Version')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const client = new TextInputBuilder()
      .setCustomId('client')
      .setLabel('Client')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const modLoader = new TextInputBuilder()
      .setCustomId('modLoader')
      .setLabel('Mod Loader / Modpack')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const edition = new TextInputBuilder()
      .setCustomId('minecraftEdition')
      .setLabel('Minecraft Edition')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Java');

    const info = new TextInputBuilder()
      .setCustomId('additionalInformation')
      .setLabel('Optional Additional Information')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(minecraftUser),
      new ActionRowBuilder<TextInputBuilder>().addComponents(minecraftVersion),
      new ActionRowBuilder<TextInputBuilder>().addComponents(client),
      new ActionRowBuilder<TextInputBuilder>().addComponents(modLoader),
      new ActionRowBuilder<TextInputBuilder>().addComponents(edition),
      new ActionRowBuilder<TextInputBuilder>().addComponents(info)
    );

    await interaction.showModal(modal);
  },
};
