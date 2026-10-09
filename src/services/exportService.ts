import { prisma } from '../database/prisma.js';

export async function exportRegistrations(eventId: string, format: 'csv' | 'json' | 'markdown') {
  const registrations = await prisma.registration.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  });

  if (format === 'json') {
    return JSON.stringify(registrations, null, 2);
  }

  if (format === 'markdown') {
    const lines = [
      '| Registration ID | Status | Minecraft Username | Version | Client |',
      '| --- | --- | --- | --- | --- |',
    ];

    for (const item of registrations) {
      lines.push(
        `| ${item.registrationId} | ${item.status} | ${item.minecraftUsername} | ${item.minecraftVersion} | ${item.client ?? 'N/A'} |`
      );
    }

    return lines.join('\n');
  }

  const headers = [
    'registrationId',
    'discordUserId',
    'discordUsername',
    'minecraftUsername',
    'minecraftVersion',
    'client',
    'modLoader',
    'status',
  ];

  const rows = registrations.map((item) => [
    item.registrationId,
    item.discordUserId,
    item.discordUsername,
    item.minecraftUsername,
    item.minecraftVersion,
    item.client ?? '',
    item.modLoader ?? '',
    item.status,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csv;
}
