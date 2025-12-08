# 🔢 AI Number Recognizer

A modern web application that uses Google's Gemini AI to recognize handwritten or printed numbers from images. Built with React, Firebase, and powered by cutting-edge AI technology.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://digit-recognizer-aditya.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

## ✨ Features

- 🎯 **AI-Powered Recognition** - Identifies complete numbers (not just single digits) using Gemini 2.5 Flash
- 🖼️ **Drag & Drop Upload** - Easy image upload with drag-and-drop support
- 🔐 **Google Authentication** - Secure sign-in with Firebase Auth
- ☁️ **Cloud Storage** - Images automatically saved to Firebase Storage
- 🎨 **Modern UI** - Beautiful gradient design with glass-morphism effects
- ⚡ **Rate Limiting** - 2 uploads per hour, 5 per day (client-side protection)
- 📱 **Fully Responsive** - Works seamlessly on desktop and mobile devices
- 🚀 **Real-time Analysis** - Get results in seconds

## 🎥 Demo

**Try it live:** [https://digit-recognizer-aditya.web.app](https://digit-recognizer-aditya.web.app)

### How it works:
1. Sign in with Google
2. Upload an image containing a number (drag & drop or click)
3. AI analyzes and identifies the complete number
4. View results and copy the cloud storage URL

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Modern icon library
- **Firebase SDK** - Authentication and Storage

### Backend
- **Firebase Functions** - Serverless API endpoints
- **Google Gemini AI** - Vision and text generation
- **Firebase Hosting** - Static site hosting
- **Cloud Storage** - Image file storage

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Google Cloud account with Gemini API access
- A Firebase project

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Aditya26189/digit-recognizer-ai.git
cd digit-recognizer-ai
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install function dependencies
cd functions
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Custom function URL
VITE_FUNCTION_URL=http://127.0.0.1:5001/your-project/us-central1/analyzeDigit
```

Create a `functions/.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Hosting
# - Functions
# - Storage
```

### 5. Run Locally

**Option A: With Firebase Emulators (Recommended)**

```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start frontend dev server
npm run dev
```

**Option B: Using Deployed Functions**

```bash
# Just run the frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 📦 Deployment

### Deploy Everything

```bash
# Build frontend
npm run build

# Deploy to Firebase
firebase deploy
```

### Deploy Only Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Only Functions

```bash
firebase deploy --only functions
```

## 🏗️ Project Structure

```
digit-recognizer/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation bar
│   │   └── ProfileChip.jsx     # User profile display
│   ├── config/
│   │   └── firebase.js         # Firebase configuration
│   ├── utils/
│   │   ├── geminiService.js    # Gemini API integration
│   │   ├── storageService.js   # Firebase Storage helpers
│   │   └── rateLimiter.js      # Upload rate limiting
│   ├── App.jsx                 # Main app component
│   ├── ImageUpload.jsx         # Upload & analysis UI
│   └── main.jsx                # React entry point
├── functions/
│   ├── index.js                # Cloud Function (Gemini integration)
│   └── package.json            # Function dependencies
├── public/                     # Static assets
├── firebase.json               # Firebase configuration
├── vite.config.js              # Vite configuration
└── package.json                # Project dependencies
```

## 🔧 Configuration

### Rate Limiting

Edit `src/utils/rateLimiter.js` to adjust limits:

```javascript
const HOURLY_LIMIT = 2;  // Uploads per hour
const DAILY_LIMIT = 5;   // Uploads per day
```

### Gemini Prompt

Modify the AI prompt in `functions/index.js`:

```javascript
const result = await model.generateContent([
  "Your custom prompt here...",
  { inlineData: { data: cleanBase64, mimeType } }
]);
```

### Supported File Types

Currently supports:
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)

Max file size: **5MB**

## 🔐 Security Notes

- **API Keys**: All sensitive keys are stored in environment variables
- **Firebase Rules**: Configure Storage and Firestore rules in Firebase Console
- **CORS**: Cloud Function allows all origins (adjust in production)
- **Rate Limiting**: Client-side only (can be bypassed - add server-side for production)

### Recommended: Restrict API Keys

1. **Firebase API Key**: Add HTTP referrer restrictions in Google Cloud Console
2. **Gemini API Key**: Restrict to Cloud Functions URLs only

## 🐛 Troubleshooting

### "No number found in the image"
- Ensure the image has clear, visible numbers
- Try better lighting or higher contrast
- Supported: handwritten and printed numbers

### Rate Limit Errors
- Wait for the specified time period
- Or clear localStorage: `localStorage.clear()`

### Function Not Updating Locally
- Restart Firebase emulators: `Ctrl+C` then `firebase emulators:start`

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📊 Performance

- **Initial Load**: ~500KB (gzipped)
- **Analysis Time**: 2-5 seconds average
- **Uptime**: 99.9% (Firebase SLA)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Aditya**
- GitHub: [@Aditya26189](https://github.com/Aditya26189)
- Project: [digit-recognizer-ai](https://github.com/Aditya26189/digit-recognizer-ai)

## 🙏 Acknowledgments

- [Google Gemini AI](https://deepmind.google/technologies/gemini/) for powerful vision AI
- [Firebase](https://firebase.google.com/) for seamless backend infrastructure
- [Lucide Icons](https://lucide.dev/) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for rapid UI development

## 📧 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/Aditya26189/digit-recognizer-ai/issues)
- Check the [Troubleshooting](#-troubleshooting) section

---

⭐ **Star this repo if you find it helpful!**
