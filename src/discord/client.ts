import { Interaction, ModalSubmitInteraction } from 'discord.js';
import { prisma } from '../database/prisma.js';
import { submitRegistration } from '../services/registrationService.js';

export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.customId.startsWith('register:')) {
    return;
  }

  const eventId = interaction.customId.replace('register:', '');
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    await interaction.reply({ content: 'This event could not be found.', ephemeral: true });
    return;
  }

  const minecraftUsername = interaction.fields.getTextInputValue('minecraftUsername');
  const minecraftVersion = interaction.fields.getTextInputValue('minecraftVersion');
  const client = interaction.fields.getTextInputValue('client');
  const modLoader = interaction.fields.getTextInputValue('modLoader');
  const minecraftEdition = interaction.fields.getTextInputValue('minecraftEdition');
  const additionalInformation = interaction.fields.getTextInputValue('additionalInformation') || null;

  try {
    const registration = await submitRegistration({
      eventId,
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      minecraftUsername,
      minecraftVersion,
      client,
      modLoader,
      minecraftEdition,
      additionalInformation,
    });

    await interaction.reply({
      content: `Registration submitted successfully for ${event.name}. Your registration ID is ${registration.registrationId}.`,
      ephemeral: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error.';
    await interaction.reply({ content: `Registration failed: ${message}`, ephemeral: true });
  }
}

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
  }
}
