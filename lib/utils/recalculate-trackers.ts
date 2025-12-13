// lib/cron/recalculate-trackers.ts
import { recalculateAllSessionTrackers } from "../drizzle/schema";

export async function recalculateTrackers() {
  console.log('🔄 Recalculating all session trackers...');
  try {
    await recalculateAllSessionTrackers();
    console.log('✅ All session trackers recalculated');
  } catch (error) {
    console.error('❌ Error recalculating trackers:', error);
  }
}