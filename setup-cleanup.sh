#!/bin/bash

# Quick Setup Script for Image Cleanup System
# Run this after enabling Firestore in Firebase Console

echo "🚀 Setting up Image Cleanup System..."
echo ""

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "📦 Installing firebase-admin in functions..."
cd functions
npm install firebase-admin
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Enable Firestore Database:"
echo "   → Go to: https://console.firebase.google.com/"
echo "   → Select your project"
echo "   → Firestore Database → Create Database"
echo ""
echo "2. Update Firestore Security Rules:"
echo "   → Paste the rules from CLEANUP_GUIDE.md"
echo ""
echo "3. Deploy Cloud Functions:"
echo "   → Run: firebase deploy --only functions"
echo ""
echo "4. Test the system:"
echo "   → Upload an image"
echo "   → Check Firestore 'uploadedImages' collection"
echo "   → Wait for automatic cleanup (or trigger manually)"
echo ""
echo "📚 For detailed instructions, see CLEANUP_GUIDE.md"
echo ""
