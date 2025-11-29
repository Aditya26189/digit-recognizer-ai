import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, X, ExternalLink, Copy } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
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
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyURL = async () => {
    if (uploadedImageURL) {
      try {
        await navigator.clipboard.writeText(uploadedImageURL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
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
    <div className="w-full max-w-[760px] mx-auto">
      {/* Main Card - Glass Panel */}
      <div 
        className="glass-card p-6 md:p-9 animate-slideUp"
        style={{ animationDelay: '100ms' }}
      >
        {!selectedFile ? (
          /* Upload Drop Zone */
          <div
            className={`
              relative border-2 border-dashed rounded-[18px] p-8 md:p-12 text-center 
              transition-all duration-300 cursor-pointer group
              focus-within:ring-2 focus-within:ring-brand-orange/40 focus-within:outline-none
              ${isDragging
                ? 'border-brand-orange bg-brand-orange/5 ring-1 ring-brand-orange/30 scale-[1.01] -translate-y-1'
                : 'border-slate-700/50 hover:border-brand-orange/30 hover:bg-white/[0.02] hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-orange/5'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload image"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 transition-transform group-hover:scale-110 duration-300">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold text-text-primary mb-1.5">
                  Drop or click to upload
                </p>
                <p className="text-sm text-text-secondary font-medium">
                  PNG / JPG · max 5MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Preview & Actions */
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Preview Thumbnail */}
              <div className="flex-shrink-0 self-start">
                <div className="relative w-full md:w-32 h-64 md:h-32 rounded-xl overflow-hidden border border-white/5 shadow-inner bg-[#0b1114] flex items-center justify-center group transition-transform hover:-translate-y-1 duration-300">
                  <img
                    src={imagePreview}
                    alt="Uploaded digit preview"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600/90 text-white rounded-full p-1.5 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/40 md:hidden"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* File Meta & Actions */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="mb-5">
                  <p className="text-base font-medium text-text-primary truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                {/* Action Buttons */}
                {!isAnalyzing && !recognizedDigit && (
                  <div className="flex flex-col sm:flex-row gap-3 items-center sm:justify-center">
                    <button
                      onClick={handleAnalyze}
                      disabled={!auth.currentUser}
                      className={`w-[150px] text-sm sm:text-base font-semibold bg-brand-orange/90 hover:bg-brand-orange text-white px-4 py-2.5 rounded-full transition shadow-lg shadow-orange-900/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                        !auth.currentUser ? '' : 'focus:outline-none focus:ring-2 focus:ring-brand-orange/40'
                      }`}
                    >
                      <h2 className="text-base font-semibold">Analyze Digit</h2>
                    </button>
                    <button
                      onClick={handleClear}
                      className="w-[150px] text-sm sm:text-base font-semibold text-white px-4 py-2.5 rounded-full transition shadow-lg shadow-black/20 border border-white/10 hover:bg-white/10"
                    >
                      <h2 className="text-base font-semibold">Clear</h2>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud Storage Status */}
            {uploadedImageURL && (
              <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Image saved to cloud</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleCopyURL}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={uploadedImageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    title="View image"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
            {copied && (
              <p className="text-xs text-emerald-400 text-center">URL copied to clipboard!</p>
            )}
          </div>
        )}
      </div>

      {/* Loading Progress */}
      {isAnalyzing && (
        <div className="mt-6 glass-panel rounded-xl p-6 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-5 h-5">
              <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />
            </div>
            <p className="text-text-primary font-medium">{uploadProgress}</p>
          </div>
          <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-orange rounded-full animate-pulse"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {recognizedDigit && !isAnalyzing && (
        <div className="mt-6 glass-card p-8 animate-scaleIn flex flex-col items-center text-center">
          <h2 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wider">Identified Digit</h2>
          <div 
            className="
              inline-flex items-center justify-center
              bg-brand-orange
              rounded-2xl w-24 h-24 md:w-32 md:h-32
              shadow-2xl shadow-brand-orange/20
              mb-6
            "
          >
            <h1 className="text-6xl md:text-8xl font-bold text-white leading-none">
              {recognizedDigit}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
            <CheckCircle className="w-4 h-4" />
            <h2 className="text-base font-semibold">Successfully identified</h2>
          </div>
          
          <button
            onClick={handleClear}
            className="mt-8 text-text-secondary hover:text-text-primary text-sm font-medium hover:underline decoration-brand-orange/50 underline-offset-4 transition-all"
          >
            <h2 className="text-base font-semibold">Analyze another image</h2>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-red-300 font-bold text-lg">Error</h2>
            <h2 className="text-red-400 text-base mt-1 font-semibold">{error}</h2>
          </div>
        </div>
      )}

      {/* Storage Warning */}
      {storageError && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-amber-300 text-xs">{storageError}</p>
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleFileInput}
        aria-label="File upload input"
      />
    </div>
  );
}
