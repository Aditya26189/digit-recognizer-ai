# Image Cleanup System - Setup Guide

This system automatically deletes uploaded images after 1 day to save storage space and maintain privacy.

## How It Works

1. **Metadata Tracking**: When images are uploaded, their metadata (file path, upload time, etc.) is saved to Firestore
2. **Scheduled Cleanup**: A Cloud Function runs daily at 2 AM to delete images older than 24 hours
3. **Manual Cleanup**: You can also trigger cleanup manually through the client-side or via HTTP endpoint

## Setup Instructions

### 1. Firestore Database Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **Create database**
5. Choose **Start in production mode** (we'll set rules next)
6. Select your preferred location
7. Click **Enable**

### 2. Firestore Security Rules

Update your Firestore security rules to allow the app to read/write image metadata:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // uploadedImages collection - users can only write their own, read/delete requires auth
    match /uploadedImages/{imageId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, delete: if request.auth != null;
    }
  }
}
```

### 3. Storage Security Rules

Ensure your Storage rules allow deletion (should already be set):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null;
    }
  }
}
```

### 4. Deploy Cloud Functions

The Cloud Functions include:
- `cleanupOldImages`: Scheduled function (runs daily at 2 AM)
- `manualCleanup`: HTTP endpoint for manual cleanup

Deploy the functions:

```bash
cd functions
npm install firebase-admin
cd ..
firebase deploy --only functions
```

### 5. (Optional) Enable Client-Side Periodic Cleanup

If you want cleanup to run periodically on the client side as well, add this to your `App.jsx`:

```javascript
import { scheduleAutomaticCleanup } from './utils/cleanupService';

// Inside your App component, add this useEffect:
useEffect(() => {
  // Run cleanup every 6 hours
  const cleanupIntervalId = scheduleAutomaticCleanup(6, 1);
  
  return () => {
    // Clear interval on unmount
    clearInterval(cleanupIntervalId);
  };
}, []);
```

## Usage

### Automatic Cleanup (Recommended)

The Cloud Function `cleanupOldImages` runs automatically every day at 2 AM. No action needed!

### Manual Cleanup

#### From Client Code:

```javascript
import { runCleanup } from './utils/cleanupService';

// Delete images older than 1 day
await runCleanup(1);

// Delete images older than 7 days
await runCleanup(7);
```

#### Via HTTP Endpoint:

```bash
curl -X POST https://YOUR-PROJECT.cloudfunctions.net/manualCleanup \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 1}'
```

### Check Old Images Count:

```javascript
import { checkOldImagesCount } from './utils/cleanupService';

const count = await checkOldImagesCount(1);
console.log(`Found ${count} images older than 1 day`);
```

## Configuration

### Change Cleanup Schedule

Edit the cron expression in `functions/index.js`:

```javascript
schedule: "0 2 * * *", // Daily at 2 AM
// Other examples:
// "0 */6 * * *"  - Every 6 hours
// "0 0 */2 * *"  - Every 2 days at midnight
// "0 3 * * 0"    - Every Sunday at 3 AM
```

### Change Retention Period

To keep images for longer/shorter periods:

1. **In Cloud Function** (`functions/index.js`):
   ```javascript
   const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // Change 24 to desired hours
   ```

2. **In Client Code**:
   ```javascript
   await runCleanup(2); // Keep for 2 days instead of 1
   ```

## Troubleshooting

### Firestore Permission Denied

Make sure Firestore security rules are properly configured and user is authenticated.

### Storage Permission Denied

Check Firebase Storage rules allow deletion for authenticated users.

### Cloud Function Not Running

1. Check function logs: `firebase functions:log`
2. Verify the function is deployed: `firebase functions:list`
3. Check Cloud Scheduler in Google Cloud Console

### Images Not Being Deleted

1. Verify metadata is being saved to Firestore during upload
2. Check Firestore collection `uploadedImages` has documents with `createdAt` timestamps
3. Run manual cleanup to test: `await runCleanup(0)` (deletes all images)

## Cost Considerations

- **Firestore**: Minimal cost (document reads/writes/deletes)
- **Cloud Functions**: Scheduled function runs once per day (very low cost)
- **Storage**: Saves significant cost by regularly deleting unused files

## Testing

Test the cleanup system:

```javascript
// Upload a test image
// Then in console:
import { runCleanup } from './utils/cleanupService';

// Delete all images (use 0 days for testing)
await runCleanup(0);
```

## Security Notes

- Only authenticated users can upload images
- Each user can only write metadata for their own images
- Cleanup can be triggered by any authenticated user (client-side) or by the Cloud Function
- Consider restricting the `manualCleanup` endpoint to admin users in production
