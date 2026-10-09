# Syxlor Events Registrations

A production-oriented Discord event management bot for Minecraft tournaments and community events.

## Features

- Event creation and lifecycle management
- Public registration information with dynamic embeds
- Registration submission using Discord modals
- Approval, rejection, waitlisting, and cancellation flow
- Staff controls and admin checks
- Database-backed persistence with Prisma + PostgreSQL
- Audit logging for compliance and moderation

## Requirements

- Node.js 18+
- PostgreSQL 14+
- Discord bot token

## Setup

1. Copy `.env.example` to `.env` and configure your values.
2. Create a PostgreSQL database and set `DATABASE_URL`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

5. Apply the schema:

   ```bash
   npm run db:push
   ```

6. Start the bot:

   ```bash
   npm run dev
   ```

## Commands

- `/helpse`
- `/event-create`
- `/event-list`
- `/register`
- `/my-registration`

## Notes

This project is structured for real production usage but still expects environment-specific setup for your own Discord guilds, staff roles, and PostgreSQL instance.
