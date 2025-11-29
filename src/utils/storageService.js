// Firebase Storage imports
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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

    // Return result object
    return {
      downloadURL,
      filePath,
      uploadedAt: timestamp,
      fileSize: file.size,
      fileName: originalName
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
 * Deletes an image from Firebase Storage.
 * @param {string} filePath - The storage path of the file to delete.
 * @returns {Promise<boolean>} - True if deletion was successful.
 * @throws {Error} If deletion fails.
 */
export async function deleteImage(filePath) {
  if (!filePath || filePath.trim() === '') {
    throw new Error('File path required');
  }

  if (!storage) {
    throw new Error('Storage not configured');
  }

  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log('File deleted successfully:', filePath);
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
