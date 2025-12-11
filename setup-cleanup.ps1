# Quick Setup Script for Image Cleanup System
# Run this after enabling Firestore in Firebase Console

Write-Host "🚀 Setting up Image Cleanup System..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing firebase-admin in functions..." -ForegroundColor Cyan
Set-Location functions
npm install firebase-admin
Set-Location ..

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Enable Firestore Database:"
Write-Host "   → Go to: https://console.firebase.google.com/"
Write-Host "   → Select your project"
Write-Host "   → Firestore Database → Create Database"
Write-Host ""
Write-Host "2. Update Firestore Security Rules:"
Write-Host "   → Paste the rules from CLEANUP_GUIDE.md"
Write-Host ""
Write-Host "3. Deploy Cloud Functions:"
Write-Host "   → Run: firebase deploy --only functions"
Write-Host ""
Write-Host "4. Test the system:"
Write-Host "   → Upload an image"
Write-Host "   → Check Firestore 'uploadedImages' collection"
Write-Host "   → Wait for automatic cleanup (or trigger manually)"
Write-Host ""
Write-Host "📚 For detailed instructions, see CLEANUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
