const { getDatabase, getMessaging } = require('../config/firebase');

/**
 * Get all valid FCM tokens from Realtime Database
 * Structure: All_Users/{uid}/fcmToken
 */
async function getAllTokens() {
  const db = getDatabase();
  const snapshot = await db.ref('All_Users').once('value');
  const users = snapshot.val() || {};

  const tokens = [];
  const tokenToUid = {}; // for later cleanup of invalid tokens

  for (const [uid, userData] of Object.entries(users)) {
    if (userData && typeof userData.fcmToken === 'string' && userData.fcmToken.trim().length > 10) {
      const token = userData.fcmToken.trim();
      tokens.push(token);
      tokenToUid[token] = uid;
    }
  }

  return { tokens, tokenToUid };
}

/**
 * Get single user FCM token
 */
async function getUserToken(uid) {
  if (!uid || typeof uid !== 'string') {
    return null;
  }

  const db = getDatabase();
  const snapshot = await db.ref(`All_Users/${uid}/fcmToken`).once('value');
  const token = snapshot.val();

  if (typeof token === 'string' && token.trim().length > 10) {
    return token.trim();
  }
  return null;
}

/**
 * Remove invalid/expired token from database
 */
async function removeInvalidToken(uid) {
  try {
    const db = getDatabase();
    await db.ref(`All_Users/${uid}/fcmToken`).remove();
    console.log(`🗑️ Removed invalid FCM token for user: ${uid}`);
  } catch (err) {
    console.error(`Failed to remove invalid token for ${uid}:`, err.message);
  }
}

/**
 * Send notification to multiple tokens using FCM HTTP v1 (via Admin SDK)
 * Invalid tokens are automatically skipped and cleaned up.
 */
async function sendToTokens(tokens, tokenToUid, title, message, data = {}) {
  if (!tokens || tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
    };
  }

  const messaging = getMessaging();

  // FCM allows max 500 tokens per multicast
  const BATCH_SIZE = 500;
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    const multicastMessage = {
      tokens: batch,
      notification: {
        title: title,
        body: message,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // useful for Flutter/Android
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(multicastMessage);

      successCount += response.successCount;
      failureCount += response.failureCount;

      // Handle invalid tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          const token = batch[idx];

          // These error codes mean the token is permanently invalid
          const permanentErrors = [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered',
            'messaging/invalid-argument',
          ];

          if (permanentErrors.includes(errorCode)) {
            invalidTokens.push(token);
            const uid = tokenToUid[token];
            if (uid) {
              // Fire and forget cleanup
              removeInvalidToken(uid).catch(() => {});
            }
          } else {
            console.warn(`Temporary FCM error for token: ${errorCode}`);
          }
        }
      });
    } catch (err) {
      console.error('Multicast send error:', err.message);
      failureCount += batch.length;
    }
  }

  return { successCount, failureCount, invalidTokens };
}

/**
 * Main send notification function
 */
async function sendNotification({ title, message, targetType, targetUserId, data = {} }) {
  if (!title || !message) {
    throw new Error('title and message are required');
  }

  if (targetType === 'all') {
    const { tokens, tokenToUid } = await getAllTokens();

    if (tokens.length === 0) {
      return {
        success: true,
        message: 'No valid FCM tokens found',
        details: { successCount: 0, failureCount: 0 },
      };
    }

    const result = await sendToTokens(tokens, tokenToUid, title, message, data);

    return {
      success: true,
      message: `Notification sent. Success: ${result.successCount}, Failed: ${result.failureCount}`,
      details: result,
    };
  }

  if (targetType === 'user') {
    if (!targetUserId) {
      throw new Error('targetUserId is required when targetType is "user"');
    }

    const token = await getUserToken(targetUserId);

    if (!token) {
      return {
        success: false,
        message: `No valid FCM token found for user: ${targetUserId}`,
      };
    }

    const tokenToUid = { [token]: targetUserId };
    const result = await sendToTokens([token], tokenToUid, title, message, data);

    if (result.successCount > 0) {
      return {
        success: true,
        message: 'Notification sent successfully',
        details: result,
      };
    }

    return {
      success: false,
      message: 'Failed to send notification (token may be invalid)',
      details: result,
    };
  }

  throw new Error('targetType must be either "all" or "user"');
}

module.exports = {
  sendNotification,
  getAllTokens,
  getUserToken,
};
