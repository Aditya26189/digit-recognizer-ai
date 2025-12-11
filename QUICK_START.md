# Image Auto-Delete - Quick Reference

## ⚡ What You Got

✅ **Automatic deletion** of images after 1 day  
✅ **Cloud Function** runs daily at 2 AM  
✅ **Manual cleanup** option available  
✅ **Admin UI** for management  

---

## 🎯 Quick Setup (3 Steps)

### 1️⃣ Enable Firestore
Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Create Database

### 2️⃣ Add Security Rules
In Firestore Rules tab, add:
```javascript
match /uploadedImages/{imageId} {
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow read, delete: if request.auth != null;
}
```

### 3️⃣ Deploy Functions
```bash
cd functions
npm install firebase-admin
cd ..
firebase deploy --only functions
```

✨ **Done!** Images will auto-delete after 24 hours.

---

## 🔧 Common Tasks

### Check How Many Images Will Be Deleted
```javascript
import { checkOldImagesCount } from './utils/cleanupService';
const count = await checkOldImagesCount(1); // 1 = days old
```

### Manually Delete Old Images
```javascript
import { runCleanup } from './utils/cleanupService';
await runCleanup(1); // Delete images older than 1 day
```

### Add Cleanup UI (Optional)
```jsx
import CleanupManager from './components/CleanupManager';

// In your admin panel:
<CleanupManager />
```

### Enable Periodic Cleanup (Optional)
```jsx
// In App.jsx
import { scheduleAutomaticCleanup } from './utils/cleanupService';

useEffect(() => {
  const id = scheduleAutomaticCleanup(6, 1); // Every 6 hours
  return () => clearInterval(id);
}, []);
```

---

## ⚙️ Configuration

### Change Retention Period
**Default:** 1 day (24 hours)

**To change:**
- Edit `functions/index.js` line ~71: Change `24` to desired hours
- Or use manual cleanup: `runCleanup(7)` for 7 days

### Change Schedule
**Default:** Daily at 2 AM

**To change:**
- Edit `functions/index.js` line ~67: `schedule: "0 2 * * *"`
- Common patterns:
  - `"0 */6 * * *"` = Every 6 hours
  - `"0 0 * * 0"` = Weekly (Sunday midnight)
  - `"0 3 * * *"` = Daily at 3 AM

---

## 🧪 Testing

```javascript
// Test cleanup (deletes ALL images - use in dev only!)
import { runCleanup } from './utils/cleanupService';
await runCleanup(0); // 0 days = delete everything
```

---

## 📁 New Files Created

- ✨ `src/utils/cleanupService.js` - Cleanup utilities
- ✨ `src/components/CleanupManager.jsx` - Admin UI
- ✨ `CLEANUP_GUIDE.md` - Full documentation
- ✨ `CLEANUP_IMPLEMENTATION.md` - Technical details

## ✏️ Modified Files

- `src/config/firebase.js` - Added Firestore
- `src/utils/storageService.js` - Metadata tracking
- `functions/index.js` - Cleanup functions

---

## 🆘 Troubleshooting

**Images not deleting?**
1. Check Firestore has `uploadedImages` collection
2. Verify documents have `createdAt` field
3. Check function logs: `firebase functions:log`

**Permission errors?**
1. Update Firestore rules (see step 2 above)
2. Update Storage rules if needed

**Function not running?**
1. Deploy: `firebase deploy --only functions`
2. Check: `firebase functions:list`
3. View logs: `firebase functions:log --only cleanupOldImages`

---

## 📊 Monitor Cleanup

### View Function Logs
```bash
firebase functions:log --only cleanupOldImages
```

### Manual Trigger via API
```bash
curl -X POST https://YOUR-PROJECT.cloudfunctions.net/manualCleanup \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 1}'
```

---

## 💰 Cost Impact

- **Firestore**: ~$0.01/day (minimal reads/writes)
- **Cloud Functions**: ~$0.01/day (1 daily execution)
- **Storage Saved**: Significant! (depends on usage)

**Net Effect:** Major cost savings from reduced storage 💰

---

## 🎓 Learn More

- Full docs: `CLEANUP_GUIDE.md`
- Implementation: `CLEANUP_IMPLEMENTATION.md`
- Questions? Check the troubleshooting section above

---

**Quick Setup Script:**
```bash
# Windows PowerShell:
.\setup-cleanup.ps1

# macOS/Linux:
chmod +x setup-cleanup.sh
./setup-cleanup.sh
```
