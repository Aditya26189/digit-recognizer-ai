/**
 * Rate limiter for image uploads
 * Limits: 2 uploads per hour, 5 uploads per day
 */

const STORAGE_KEY_PREFIX = 'upload_timestamps_';
const HOURLY_LIMIT = 2;
const DAILY_LIMIT = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Get upload timestamps for a user from localStorage
 * @param {string} userId - The user's unique ID
 * @returns {number[]} Array of timestamps
 */
function getUploadTimestamps(userId) {
  const key = STORAGE_KEY_PREFIX + userId;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    const timestamps = JSON.parse(stored);
    return Array.isArray(timestamps) ? timestamps : [];
  } catch {
    return [];
  }
}

/**
 * Save upload timestamps for a user to localStorage
 * @param {string} userId - The user's unique ID
 * @param {number[]} timestamps - Array of timestamps
 */
function saveUploadTimestamps(userId, timestamps) {
  const key = STORAGE_KEY_PREFIX + userId;
  localStorage.setItem(key, JSON.stringify(timestamps));
}

/**
 * Clean up old timestamps (older than 24 hours)
 * @param {number[]} timestamps - Array of timestamps
 * @returns {number[]} Filtered timestamps
 */
function cleanOldTimestamps(timestamps) {
  const now = Date.now();
  return timestamps.filter(ts => now - ts < ONE_DAY_MS);
}

/**
 * Check if user can upload based on rate limits
 * @param {string} userId - The user's unique ID
 * @returns {{allowed: boolean, reason?: string, waitTime?: number, hourlyCount: number, dailyCount: number}}
 */
export function checkRateLimit(userId) {
  if (!userId) {
    return { allowed: false, reason: 'User ID required', hourlyCount: 0, dailyCount: 0 };
  }

  const now = Date.now();
  let timestamps = getUploadTimestamps(userId);
  
  // Clean up old timestamps
  timestamps = cleanOldTimestamps(timestamps);
  
  // Count uploads in the last hour
  const hourlyUploads = timestamps.filter(ts => now - ts < ONE_HOUR_MS);
  const hourlyCount = hourlyUploads.length;
  
  // Count uploads in the last day
  const dailyCount = timestamps.length;
  
  // Check hourly limit
  if (hourlyCount >= HOURLY_LIMIT) {
    const oldestHourlyUpload = Math.min(...hourlyUploads);
    const waitTime = ONE_HOUR_MS - (now - oldestHourlyUpload);
    const minutesLeft = Math.ceil(waitTime / (60 * 1000));
    
    return {
      allowed: false,
      reason: `Upload limit reached. You can upload ${HOURLY_LIMIT} images per hour. Please wait ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
      waitTime,
      hourlyCount,
      dailyCount
    };
  }
  
  // Check daily limit
  if (dailyCount >= DAILY_LIMIT) {
    const oldestDailyUpload = Math.min(...timestamps);
    const waitTime = ONE_DAY_MS - (now - oldestDailyUpload);
    const hoursLeft = Math.ceil(waitTime / (60 * 60 * 1000));
    
    return {
      allowed: false,
      reason: `Daily limit reached. You can upload ${DAILY_LIMIT} images per day. Please wait ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`,
      waitTime,
      hourlyCount,
      dailyCount
    };
  }
  
  return { allowed: true, hourlyCount, dailyCount };
}

/**
 * Record a successful upload
 * @param {string} userId - The user's unique ID
 */
export function recordUpload(userId) {
  if (!userId) return;
  
  let timestamps = getUploadTimestamps(userId);
  timestamps = cleanOldTimestamps(timestamps);
  timestamps.push(Date.now());
  saveUploadTimestamps(userId, timestamps);
}

/**
 * Get current usage stats for a user
 * @param {string} userId - The user's unique ID
 * @returns {{hourlyCount: number, dailyCount: number, hourlyLimit: number, dailyLimit: number}}
 */
export function getUsageStats(userId) {
  if (!userId) {
    return { hourlyCount: 0, dailyCount: 0, hourlyLimit: HOURLY_LIMIT, dailyLimit: DAILY_LIMIT };
  }
  
  const now = Date.now();
  let timestamps = getUploadTimestamps(userId);
  timestamps = cleanOldTimestamps(timestamps);
  
  const hourlyCount = timestamps.filter(ts => now - ts < ONE_HOUR_MS).length;
  const dailyCount = timestamps.length;
  
  return {
    hourlyCount,
    dailyCount,
    hourlyLimit: HOURLY_LIMIT,
    dailyLimit: DAILY_LIMIT
  };
}
