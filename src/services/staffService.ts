import { GuildMember, Interaction } from 'discord.js';
import { env } from '../config/env.js';

export async function ensureStaffAccess(interaction: Interaction): Promise<boolean> {
  if (!interaction.guild || !interaction.member) {
    return false;
  }

  const member = interaction.member as GuildMember;
  const staffRoleId = env.STAFF_ROLE_ID;

  if (staffRoleId && member.roles.cache.has(staffRoleId)) {
    return true;
  }

  return member.permissions.has('ManageGuild') || member.permissions.has('Administrator');
}
