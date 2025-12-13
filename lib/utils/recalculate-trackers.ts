// lib/cron/recalculate-trackers.ts
import { recalculateAllSessionTrackers } from "../drizzle/schema";

export async function recalculateTrackers() {
  console.log('🔄 Recalculating all session trackers...');
  await recalculateAllSessionTrackers();
}
