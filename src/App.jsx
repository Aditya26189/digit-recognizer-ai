// React imports
import { useState, useEffect } from 'react'

// Firebase Auth imports
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

// Firebase Storage imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Firebase config and services
import { auth, storage, googleProvider } from './config/firebase'

// Components
import ImageUpload from './ImageUpload'

// Utilities
import { identifyDigit } from './utils/geminiService'
import './App.css'

function App() {
  // Authentication state
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Analysis state
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [error, setError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // Handle Google Sign-In with error handling
  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithPopup(auth, googleProvider)
      // User state will auto-update via onAuthStateChanged
    } catch (err) {
      console.error('Sign-in error:', err)
      
      // Handle specific error codes
      if (err.code === 'auth/popup-closed-by-user') {
        alert('Sign-in cancelled')
      } else if (err.code === 'auth/network-request-failed') {
        alert('Network error, check internet connection')
      } else if (err.code === 'auth/popup-blocked') {
        alert('Pop-up blocked by browser. Please allow pop-ups for this site.')
      } else {
        alert('Sign-in failed: ' + err.message)
      }
    } finally {
      setSigningIn(false)
    }
  }

  // Handle Sign-Out
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      // Clear analysis results on sign out
      setResult(null)
      setError(null)
    } catch (err) {
      console.error('Sign-out error:', err)
      alert('Failed to sign out: ' + err.message)
    }
  }

  // Analysis handler with Firebase Storage upload
  const handleAnalyze = async (file) => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Step 1: Upload to Firebase Storage
      setLoadingText('Uploading...')
      const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      console.log('File uploaded successfully:', downloadURL)

      // Step 2: Analyze with Gemini
      setLoadingText('Analyzing...')
      const digit = await identifyDigit(file)
      setResult(digit)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  // Loading state - Show while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in - Show login page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md">
            <div className="text-7xl mb-6">🔐</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Handwritten Digit Recognizer
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to analyze handwritten digits using AI
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="bg-white border-2 border-gray-300 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto w-full"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-semibold">
                {signingIn ? 'Signing in...' : 'Sign in with Google'}
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Logged in - Show main app with header
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with user info and sign out */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-gray-300"
          />
          <div>
            <p className="font-medium text-gray-800">Welcome, {user.displayName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition shadow-sm"
        >
          Sign Out
        </button>
      </header>

      {/* Main content */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            Handwritten Digit Recognition
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Upload an image of a handwritten digit (0-9) to identify it using AI
          </p>

          <ImageUpload onAnalyze={handleAnalyze} />

          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{loadingText}</p>
            </div>
          )}

          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 font-medium">Error: {error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-200">
              <p className="text-gray-600 mb-2">Identified Digit:</p>
              <p className="text-6xl font-bold text-green-600">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
