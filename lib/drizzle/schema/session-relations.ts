// lib/drizzle/schema/session-relations.ts
import { relations } from 'drizzle-orm';

import { eventSessions } from './session';
import { sessionLimits } from './session-limits';

export const sessionLimitsRelations = relations(sessionLimits, ({ one }) => ({
  session: one(eventSessions, {
    fields: [sessionLimits.sessionId],
    references: [eventSessions.id],
  }),
}));

export const eventSessionsExtraRelations = relations(eventSessions, ({ one }) => ({
  limits: one(sessionLimits, {
    fields: [eventSessions.id],
    references: [sessionLimits.sessionId],
  }),
}));
