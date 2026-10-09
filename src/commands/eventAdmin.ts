import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const helpseCommand = {
  data: new SlashCommandBuilder()
    .setName('helpse')
    .setDescription('Show the Syxlor Events help information.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('Syxlor Events Registrations')
      .setDescription('A professional Minecraft event-registration and management system.')
      .addFields(
        { name: 'Primary Help Command', value: '/helpse', inline: false },
        { name: 'Registration', value: '/register', inline: false },
        { name: 'My Status', value: '/my-registration', inline: false },
        { name: 'Admin', value: '/event-create /event-list', inline: false }
      )
      .setColor(0x00ae86);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
