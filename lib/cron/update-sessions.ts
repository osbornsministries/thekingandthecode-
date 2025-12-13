import { updateAllSessionsStatus } from "../utils/session-limits";

export async function updateAllSessionStatuses() {
  try {
    console.log('🔄 Updating all session statuses (session_limits)...');

    await updateAllSessionsStatus();

    console.log('✅ All session statuses updated');
  } catch (error) {
    console.error('❌ Error updating session statuses:', error);
  }
}
