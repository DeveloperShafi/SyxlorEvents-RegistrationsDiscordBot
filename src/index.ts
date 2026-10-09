import { Client, Collection, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { env, requireEnv } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { helpseCommand } from '../commands/helpse.js';
import { eventCreateCommand, eventListCommand } from '../commands/eventAdmin.js';
import { registerCommand } from '../commands/register.js';
import { myRegistrationCommand } from '../commands/myRegistration.js';
import { handleInteraction } from '../handlers/modalHandler.js';

export class SyxlorClient extends Client {
  public commands = new Collection<string, { data: SlashCommandBuilder; execute: (interaction: any) => Promise<void> }>();

  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.commands.set(helpseCommand.data.name, helpseCommand);
    this.commands.set(eventCreateCommand.data.name, eventCreateCommand);
    this.commands.set(eventListCommand.data.name, eventListCommand);
    this.commands.set(registerCommand.data.name, registerCommand);
    this.commands.set(myRegistrationCommand.data.name, myRegistrationCommand);
  }

  async start() {
    const discordToken = requireEnv('DISCORD_TOKEN');
    const clientId = requireEnv('DISCORD_CLIENT_ID');

    this.on('ready', () => {
      logger.info('Discord client ready', { user: this.user?.tag });
    });

    this.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        const command = this.commands.get(interaction.commandName);
        if (!command) {
          return;
        }

        try {
          await command.execute(interaction);
        } catch (error) {
          logger.error('Command failed', { error, command: interaction.commandName });
          await interaction.reply({
            content: 'An error occurred while processing that command.',
            ephemeral: true,
          }).catch(() => undefined);
        }
      }

      if (interaction.isModalSubmit()) {
        try {
          await handleInteraction(interaction);
        } catch (error) {
          logger.error('Modal interaction failed', { error });
        }
      }
    });

    await this.login(discordToken);

    const rest = new REST({ version: '10' }).setToken(discordToken);
    const guildId = env.DISCORD_GUILD_ID || undefined;

    const commandData = [...this.commands.values()].map((command) => command.data.toJSON());

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandData });
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commandData });
    }

    logger.info('Discord slash commands deployed');
  }
}
