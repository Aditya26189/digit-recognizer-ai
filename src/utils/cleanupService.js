// Cleanup service for managing old images
import { deleteOldImages, getOldImagesCount } from './storageService';

/**
 * Runs cleanup to delete images older than specified days.
 * Can be called manually or scheduled to run automatically.
 * @param {number} daysOld - Number of days (default: 1 day).
 * @returns {Promise<{deleted: number, failed: number, errors: Array}>}
 */
export async function runCleanup(daysOld = 1) {
  console.log(`Starting cleanup for images older than ${daysOld} day(s)...`);
  
  try {
    const results = await deleteOldImages(daysOld);
    
    if (results.deleted > 0) {
      console.log(`✅ Cleanup successful: ${results.deleted} image(s) deleted`);
    } else {
      console.log('ℹ️ No old images found to delete');
    }
    
    if (results.failed > 0) {
      console.warn(`⚠️ ${results.failed} image(s) failed to delete`);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

/**
 * Checks how many images are older than specified days.
 * @param {number} daysOld - Number of days (default: 1 day).
 * @returns {Promise<number>} - Count of old images.
 */
export async function checkOldImagesCount(daysOld = 1) {
  try {
    const count = await getOldImagesCount(daysOld);
    console.log(`Found ${count} image(s) older than ${daysOld} day(s)`);
    return count;
  } catch (error) {
    console.error('Failed to check old images:', error);
    throw error;
  }
}

/**
 * Schedules automatic cleanup to run periodically.
 * Call this on app initialization to enable automatic cleanup.
 * @param {number} intervalHours - How often to run cleanup (in hours, default: 6 hours).
 * @param {number} daysOld - Delete images older than this (default: 1 day).
 * @returns {number} - Interval ID that can be used to cancel with clearInterval().
 */
export function scheduleAutomaticCleanup(intervalHours = 6, daysOld = 1) {
  console.log(`Scheduling automatic cleanup every ${intervalHours} hour(s)`);
  
  // Run cleanup immediately
  runCleanup(daysOld).catch(err => {
    console.error('Initial cleanup failed:', err);
  });
  
  // Then schedule to run periodically
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const intervalId = setInterval(() => {
    runCleanup(daysOld).catch(err => {
      console.error('Scheduled cleanup failed:', err);
    });
  }, intervalMs);
  
  return intervalId;
}
