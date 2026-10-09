export type EventTypeName =
  | 'SOLO'
  | 'DUO'
  | 'TRIO'
  | 'SQUAD'
  | 'TEAM'
  | 'TOURNAMENT'
  | 'BATTLE_ROYALE'
  | 'CUSTOM';

export type EventStatusName =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'CHECK_IN'
  | 'LOCKED'
  | 'LIVE'
  | 'FINISHED'
  | 'ARCHIVED';

export type RegistrationStatusName =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WAITLISTED';

export type AuditActionName =
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'REGISTRATION_SUBMITTED'
  | 'REGISTRATION_UPDATED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'REGISTRATION_CANCELLED'
  | 'REGISTRATION_WAITLISTED'
  | 'WAITLIST_PROMOTED'
  | 'TEAM_CREATED'
  | 'TEAM_UPDATED'
  | 'TEAM_APPROVED'
  | 'TEAM_REJECTED'
  | 'REGISTRATION_OPENED'
  | 'REGISTRATION_CLOSED'
  | 'CAPACITY_UPDATED';

export interface EventCreateInput {
  name: string;
  description: string;
  eventType?: EventTypeName;
  playerCapacity?: number;
  teamCapacity?: number;
  teamSize?: number;
  minecraftEdition?: string[];
  minecraftVersions?: string[];
  clients?: string[];
  modLoaders?: string[];
  rules?: string[];
  registrationDeadline?: Date | string | null;
  eventStartAt?: Date | string | null;
  timezone?: string;
  approvalRequired?: boolean;
  waitlistEnabled?: boolean;
  publicDisplay?: boolean;
}

export interface RegistrationInput {
  eventId: string;
  discordUserId: string;
  discordUsername: string;
  minecraftUsername: string;
  minecraftVersion: string;
  client?: string;
  modLoader?: string;
  minecraftEdition?: string;
  additionalInformation?: string;
  teamId?: string | null;
}
