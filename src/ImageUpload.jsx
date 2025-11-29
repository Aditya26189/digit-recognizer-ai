import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
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
      return false;
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 5MB");
      return false;
    }

    return true;
  };

  const processFile = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
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
      setUploadProgress("Uploading to cloud...");
      let downloadURL = null;

      try {
        const uploadResult = await uploadImageToStorage(
          selectedFile,
          auth.currentUser.uid
        );
        downloadURL = uploadResult.downloadURL;
        setUploadedImageURL(downloadURL);
      } catch (uploadError) {
        console.error('Storage upload error:', uploadError);
        setStorageError('Storage upload failed');
      }

      // STEP 2: Analyze with Gemini
      setUploadProgress("Analyzing with AI...");
      const digit = await identifyDigit(selectedFile);
      
      // Check if -1 was returned (no digit found)
      if (digit === '-1' || digit === -1) {
        setError('No digit found in the image. Please try a different image.');
        setRecognizedDigit(null);
      } else {
        setRecognizedDigit(digit);
      }

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
      setTimeout(() => setUploadProgress(null), 2000);
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
    <div className="max-w-3xl mx-auto">
      {/* Main Upload Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        {!selectedFile ? (
          /* Upload Drop Zone */
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  Drop your image here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse from your device
                </p>
              </div>
              <div className="text-xs text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
                PNG, JPG, JPEG • Max 5MB
              </div>
            </div>
          </div>
        ) : (
          /* Preview & Analyze */
          <div>
            <div className="relative mb-6">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <button
                onClick={handleClear}
                className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-500 rounded-full p-2 shadow-lg transition-all border border-red-200"
                title="Remove"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>

            {!isAnalyzing && !recognizedDigit && (
              <button
                onClick={handleAnalyze}
                disabled={!auth.currentUser}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Digit with AI
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading Progress */}
      {isAnalyzing && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <p className="text-gray-700 font-medium">{uploadProgress}</p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse w-full rounded-full"></div>
          </div>
        </div>
      )}

      {/* Result Card with Side-by-Side Layout */}
      {recognizedDigit && !isAnalyzing && (
        <div className="bg-white rounded-2xl shadow-lg p-8 animate-scaleIn">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Thumbnail */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">Your Image</p>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-gray-200">
                <img
                  src={imagePreview}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Right: The Big Number */}
            <div className="text-center md:text-left">
              <p className="text-sm font-medium text-gray-500 mb-2">AI Prediction</p>
              <div className="text-9xl font-bold text-indigo-600 mb-4 leading-none">
                {recognizedDigit}
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Successfully identified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Storage Warning */}
      {storageError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
          <p className="text-amber-800 text-xs">{storageError}</p>
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleFileInput}
      />
    </div>
  );
}
