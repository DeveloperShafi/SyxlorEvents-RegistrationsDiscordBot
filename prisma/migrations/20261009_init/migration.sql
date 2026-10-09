-- Migration script generated for initial schema.
CREATE TYPE "EventStatus" AS ENUM ('DRAFT','REGISTRATION_OPEN','REGISTRATION_CLOSED','CHECK_IN','LOCKED','LIVE','FINISHED','ARCHIVED');
CREATE TYPE "EventType" AS ENUM ('SOLO','DUO','TRIO','SQUAD','TEAM','TOURNAMENT','BATTLE_ROYALE','CUSTOM');
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','CANCELLED','WAITLISTED');
CREATE TYPE "AuditAction" AS ENUM ('EVENT_CREATED','EVENT_UPDATED','REGISTRATION_SUBMITTED','REGISTRATION_UPDATED','REGISTRATION_APPROVED','REGISTRATION_REJECTED','REGISTRATION_CANCELLED','REGISTRATION_WAITLISTED','WAITLIST_PROMOTED','TEAM_CREATED','TEAM_UPDATED','TEAM_APPROVED','TEAM_REJECTED','REGISTRATION_OPENED','REGISTRATION_CLOSED','CAPACITY_UPDATED');

CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "bannerUrl" TEXT,
  "eventType" "EventType" NOT NULL DEFAULT 'CUSTOM',
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "playerCapacity" INTEGER NOT NULL DEFAULT 0,
  "teamCapacity" INTEGER NOT NULL DEFAULT 0,
  "teamSize" INTEGER NOT NULL DEFAULT 1,
  "registrationOpenAt" TIMESTAMP(3),
  "registrationDeadline" TIMESTAMP(3),
  "eventStartAt" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "minecraftEdition" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "minecraftVersions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "clients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "modLoaders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "documentationLinks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "registrationChannelId" TEXT,
  "reviewChannelId" TEXT,
  "registeredPlayerChannelId" TEXT,
  "registeredTeamChannelId" TEXT,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
  "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
  "publicDisplay" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Registration" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "discordUserId" TEXT NOT NULL,
  "discordUsername" TEXT NOT NULL,
  "minecraftUsername" TEXT NOT NULL,
  "minecraftVersion" TEXT NOT NULL,
  "client" TEXT,
  "modLoader" TEXT,
  "minecraftEdition" TEXT,
  "additionalInformation" TEXT,
  "teamId" TEXT,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "waitlistPosition" INTEGER,
  "approvalReason" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledBy" TEXT,
  CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "captainId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "userDiscordId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "eventId" TEXT,
  "registrationId" TEXT,
  "teamId" TEXT,
  "actorDiscordId" TEXT,
  "actorType" TEXT NOT NULL DEFAULT 'USER',
  "action" "AuditAction" NOT NULL,
  "previousState" TEXT,
  "newState" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "eventId" TEXT,
  "registrationId" TEXT,
  "userDiscordId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "dedupeKey" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Event_publicId_key" ON "Event"("publicId");
CREATE UNIQUE INDEX "Registration_registrationId_key" ON "Registration"("registrationId");
CREATE UNIQUE INDEX "Registration_eventId_discordUserId_key" ON "Registration"("eventId","discordUserId");
CREATE UNIQUE INDEX "TeamMember_registrationId_key" ON "TeamMember"("registrationId");
CREATE UNIQUE INDEX "TeamMember_teamId_userDiscordId_key" ON "TeamMember"("teamId","userDiscordId");
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId","status");
CREATE INDEX "Registration_discordUserId_idx" ON "Registration"("discordUserId");
CREATE INDEX "Registration_registrationId_idx" ON "Registration"("registrationId");
CREATE INDEX "AuditLog_eventId_idx" ON "AuditLog"("eventId");
CREATE INDEX "AuditLog_registrationId_idx" ON "AuditLog"("registrationId");
CREATE INDEX "Notification_userDiscordId_idx" ON "Notification"("userDiscordId");
CREATE INDEX "Notification_dedupeKey_idx" ON "Notification"("dedupeKey");

ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
