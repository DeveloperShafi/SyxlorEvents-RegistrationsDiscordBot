import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { createEvent, listEvents } from '../services/eventService.js';

export const eventCreateCommand = {
  data: new SlashCommandBuilder()
    .setName('event-create')
    .setDescription('Create a new event.')
    .addStringOption((option) => option.setName('name').setDescription('Event name').setRequired(true))
    .addStringOption((option) =>
      option.setName('description').setDescription('Event description').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('player-capacity').setDescription('Player capacity').setRequired(false)
    )
    .addStringOption((option) => option.setName('event-type').setDescription('Event type').addChoices(
      { name: 'Solo', value: 'SOLO' },
      { name: 'Duo', value: 'DUO' },
      { name: 'Trio', value: 'TRIO' },
      { name: 'Squad', value: 'SQUAD' },
      { name: 'Team', value: 'TEAM' },
      { name: 'Tournament', value: 'TOURNAMENT' },
      { name: 'Battle Royale', value: 'BATTLE_ROYALE' },
      { name: 'Custom', value: 'CUSTOM' }
    )),
  async execute(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description', true);
    const playerCapacity = interaction.options.getInteger('player-capacity') ?? 100;
    const eventType = (interaction.options.getString('event-type') ?? 'CUSTOM') as never;

    const event = await createEvent({
      name,
      description,
      eventType,
      playerCapacity,
      approvalRequired: true,
      waitlistEnabled: true,
      publicDisplay: true,
      minecraftEdition: ['Java'],
      minecraftVersions: ['1.20.4', '1.21.x'],
      clients: ['Vanilla', 'Lunar', 'Fabric'],
      modLoaders: ['Fabric', 'Forge', 'Vanilla'],
      rules: ['No cheating', 'Follow staff decisions', 'Respect others'],
    });

    const embed = new EmbedBuilder()
      .setTitle('Event Created')
      .setDescription(`${event.name} is now ready for registrations.`)
      .setColor(0x00ae86)
      .addFields(
        { name: 'ID', value: event.publicId, inline: true },
        { name: 'Type', value: event.eventType, inline: true },
        { name: 'Capacity', value: String(event.playerCapacity), inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export const eventListCommand = {
  data: new SlashCommandBuilder()
    .setName('event-list')
    .setDescription('Show configured events.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const events = await listEvents();
    const embed = new EmbedBuilder().setTitle('Events').setColor(0x00ae86);

    if (events.length === 0) {
      embed.setDescription('No events have been created yet.');
    } else {
      embed.setDescription(events.map((event) => `• ${event.name} (${event.status})`).join('\n'));
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
