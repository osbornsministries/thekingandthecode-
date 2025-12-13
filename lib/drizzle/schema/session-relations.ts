// lib/drizzle/schema/session-relations.ts
import { relations } from 'drizzle-orm';

import { eventSessions } from './session';
import { sessionLimits } from './session-limits';

/**
 * Each session limit belongs to exactly one event session
 */
export const sessionLimitsRelations = relations(sessionLimits, ({ one }) => ({
  session: one(eventSessions, {
    fields: [sessionLimits.sessionId],
    references: [eventSessions.id],
  }),
}));

/**
 * Each event session can have one session limit
 */
export const eventSessionsRelations = relations(eventSessions, ({ one }) => ({
  limit: one(sessionLimits, {
    fields: [eventSessions.id],
    references: [sessionLimits.sessionId],
  }),
}));
