import React, { useState, useRef, useEffect } from 'react';
import { uploadImageToStorage } from './utils/storageService';
import { auth } from './config/firebase';
import { identifyDigit } from './utils/geminiService';

export default function ImageUpload({ onAnalyze }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedDigit, setRecognizedDigit] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const fileInputRef = useRef(null);

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file) => {
    // Reset error
    setError(null);

    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload an image file (PNG, JPG, JPEG)");
      console.log("Validation failed: Invalid file type", file.type);
      return false;
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 5MB");
      console.log("Validation failed: File too large", file.size);
      return false;
    }

    return true;
  };

  const processFile = (file) => {
    console.log("File selected:", file.name);
    console.log("File size:", file.size);
    console.log("File type:", file.type);

    if (validateFile(file)) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      console.log("Preview URL generated");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    // Check if user is authenticated
    if (!auth.currentUser) {
      setError('Please sign in first');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setStorageError(null);
      setRecognizedDigit(null);

      // STEP 1: Upload to Firebase Storage
      setUploadProgress("Uploading image to cloud storage...");
      let downloadURL = null;
      let filePath = null;

      try {
        const uploadResult = await uploadImageToStorage(
          selectedFile,
          auth.currentUser.uid
        );
        downloadURL = uploadResult.downloadURL;
        filePath = uploadResult.filePath;
        setUploadedImageURL(downloadURL);
      } catch (uploadError) {
        console.error('Storage upload error:', uploadError);
        setStorageError('Storage upload failed: ' + uploadError.message);
        // Continue to Gemini analysis even if storage fails
      }

      // STEP 2: Analyze with Gemini
      setUploadProgress("Analyzing digit with AI...");
      const digit = await identifyDigit(selectedFile);
      setRecognizedDigit(digit);

      setUploadProgress("Complete!");

      // Call parent callback if provided
      if (onAnalyze) {
        onAnalyze(selectedFile);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setUploadProgress(null), 2000); // Clear progress message after 2s
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
    setUploadedImageURL(null);
    setUploadProgress(null);
    setRecognizedDigit(null);
    setStorageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Upload Zone */}
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="text-6xl mb-4">☁️</div>
          <p className="text-lg font-medium text-gray-700">Drag & drop your image here</p>
          <p className="text-gray-500 mt-2">or click to browse</p>
          <p className="text-xs text-gray-400 mt-4">Supports PNG, JPG, JPEG (Max 5MB)</p>
        </div>
      )}

      {/* Preview Zone */}
      {selectedFile && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-100">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-[400px] mx-auto rounded-lg shadow-md border-2 border-gray-200 object-contain"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
              title="Remove image"
            >
              ✕
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !auth.currentUser}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Processing...' : 'Analyze Digit'}
          </button>
        </div>
      )}

      {/* Progress Display */}
      {uploadProgress && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-600 italic flex items-center justify-center gap-2">
            <span className="inline-block animate-spin">⏳</span>
            {uploadProgress}
          </p>
        </div>
      )}

      {/* Storage Error Display */}
      {storageError && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-sm text-yellow-700">⚠️ {storageError}</p>
          <p className="text-xs text-yellow-600 mt-1">Analysis continued without cloud backup</p>
        </div>
      )}

      {/* Result Display */}
      {recognizedDigit && !isAnalyzing && (
        <div className="mt-6 bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-200">
          <p className="text-gray-600 mb-2">Identified Digit:</p>
          <p className="text-6xl font-bold text-green-600 mb-4">{recognizedDigit}</p>
          
          {uploadedImageURL && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                ✓ Image saved to cloud storage
              </p>
              <p className="text-xs text-gray-400 mt-2 break-all">
                Storage URL: {uploadedImageURL}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleFileInput}
      />
    </div>
  );
}
