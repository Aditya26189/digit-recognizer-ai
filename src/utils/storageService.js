// Firebase Storage and Firestore imports
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Uploads an image file to Firebase Storage.
 * @param {File} file - The image file to upload.
 * @param {string} userId - The user's unique ID from Firebase Auth.
 * @returns {Promise<{downloadURL: string, filePath: string, uploadedAt: number, fileSize: number, fileName: string}>}
 * @throws {Error} If validation fails or upload encounters an error.
 */
export async function uploadImageToStorage(file, userId) {
  // Validation
  if (!file) {
    throw new Error('No file provided');
  }

  if (!userId || userId.trim() === '') {
    throw new Error('User ID required');
  }

  if (!storage) {
    throw new Error('Storage not configured');
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const originalName = file.name;
    const uniqueFilename = `${timestamp}_${originalName}`;

    // Create storage reference
    const filePath = `uploads/${userId}/${uniqueFilename}`;
    const storageRef = ref(storage, filePath);

    console.log('Uploading to:', filePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload complete, getting URL...');

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);

    // Store metadata in Firestore for tracking and cleanup
    const metadata = {
      userId,
      filePath,
      downloadURL,
      fileName: originalName,
      fileSize: file.size,
      uploadedAt: serverTimestamp(),
      createdAt: timestamp // Keep numeric timestamp for easier querying
    };

    let docId = null;
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'uploadedImages'), metadata);
        docId = docRef.id;
        console.log('Metadata saved to Firestore:', docId);
      } catch (firestoreError) {
        console.error('Failed to save metadata to Firestore:', firestoreError);
        // Don't fail the upload if metadata save fails
      }
    }

    // Return result object
    return {
      downloadURL,
      filePath,
      uploadedAt: timestamp,
      fileSize: file.size,
      fileName: originalName,
      docId // Include document ID for future reference
    };

  } catch (error) {
    console.error('Storage upload error:', error);

    // Handle specific Firebase Storage errors
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check storage rules.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support.');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('Upload failed. Please check your internet connection and try again.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was cancelled.');
    } else {
      throw new Error('Upload failed: ' + error.message);
    }
  }
}

/**
 * Deletes an image from Firebase Storage and Firestore.
 * @param {string} filePath - The storage path of the file to delete.
 * @param {string} docId - Optional Firestore document ID to delete metadata.
 * @returns {Promise<boolean>} - True if deletion was successful.
 * @throws {Error} If deletion fails.
 */
export async function deleteImage(filePath, docId = null) {
  if (!filePath || filePath.trim() === '') {
    throw new Error('File path required');
  }

  if (!storage) {
    throw new Error('Storage not configured');
  }

  try {
    // Delete from Storage
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log('File deleted successfully:', filePath);

    // Delete metadata from Firestore if docId provided
    if (db && docId) {
      try {
        await deleteDoc(doc(db, 'uploadedImages', docId));
        console.log('Metadata deleted from Firestore:', docId);
      } catch (firestoreError) {
        console.error('Failed to delete metadata from Firestore:', firestoreError);
      }
    } else if (db && !docId) {
      // If no docId provided, try to find and delete by filePath
      try {
        const q = query(collection(db, 'uploadedImages'), where('filePath', '==', filePath));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await deleteDoc(doc(db, 'uploadedImages', document.id));
          console.log('Metadata deleted from Firestore:', document.id);
        });
      } catch (firestoreError) {
        console.error('Failed to delete metadata from Firestore:', firestoreError);
      }
    }

    return true;
  } catch (error) {
    console.error('Storage delete error:', error);

    if (error.code === 'storage/object-not-found') {
      throw new Error('File not found');
    } else if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied to delete file');
    } else {
      throw new Error('Delete failed: ' + error.message);
    }
  }
}

/**
 * Deletes images older than specified days.
 * @param {number} daysOld - Number of days. Images older than this will be deleted (default: 1 day).
 * @returns {Promise<{deleted: number, failed: number, errors: Array}>} - Summary of deletion results.
 */
export async function deleteOldImages(daysOld = 1) {
  if (!db) {
    throw new Error('Firestore not configured');
  }

  const results = {
    deleted: 0,
    failed: 0,
    errors: []
  };

  try {
    // Calculate timestamp for cutoff date
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    console.log(`Searching for images older than ${daysOld} day(s)...`);

    // Query Firestore for old images
    const q = query(
      collection(db, 'uploadedImages'),
      where('createdAt', '<', cutoffTime)
    );

    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} images to delete`);

    // Delete each image
    for (const document of querySnapshot.docs) {
      const data = document.data();
      try {
        await deleteImage(data.filePath, document.id);
        results.deleted++;
        console.log(`Deleted: ${data.filePath}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          filePath: data.filePath,
          error: error.message
        });
        console.error(`Failed to delete ${data.filePath}:`, error);
      }
    }

    console.log(`Cleanup complete: ${results.deleted} deleted, ${results.failed} failed`);
    return results;

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw new Error('Cleanup failed: ' + error.message);
  }
}

/**
 * Gets count of images older than specified days.
 * @param {number} daysOld - Number of days (default: 1 day).
 * @returns {Promise<number>} - Count of old images.
 */
export async function getOldImagesCount(daysOld = 1) {
  if (!db) {
    throw new Error('Firestore not configured');
  }

  try {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'uploadedImages'),
      where('createdAt', '<', cutoffTime)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error counting old images:', error);
    throw new Error('Failed to count old images: ' + error.message);
  }
}
