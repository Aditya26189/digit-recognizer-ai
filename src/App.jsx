import { useState, useEffect } from 'react'
import { auth, googleProvider } from './config/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import ImageUpload from './ImageUpload'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Error signing in:", error)
      alert(error.message)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <div className="mx-auto h-16 w-16 bg-indigo-500 rounded-xl flex items-center justify-center text-3xl">
              ⚡
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
              Digit Recognizer
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to access the AI-powered identification tool
            </p>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg transition-all shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.536-6.033-5.662s2.701-5.662,6.033-5.662c1.475,0,2.821,0.511,3.878,1.352l2.797-2.797C17.358,3.509,15.086,2.5,12.545,2.5c-5.65,0-10.239,4.589-10.239,10.239s4.589,10.239,10.239,10.239c5.12,0,9.602-3.698,10.239-9.072h-9.939V10.239z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. FIXED NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left Side: Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-2">
                  DR
                </span>
                <h1 className="text-xl font-bold text-gray-900">DigitRecognizer</h1>
              </div>
            </div>

            {/* Right Side: User Profile */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
                <span className="text-xs text-gray-500">Verified User</span>
              </div>
              
              <img
                className="h-8 w-8 rounded-full border border-gray-300"
                src={user.photoURL}
                alt="User profile"
              />
              
              <button
                onClick={handleSignOut}
                className="ml-2 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Sign Out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            AI-Powered Digit Recognition
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Upload a handwritten digit image and let our AI identify it instantly.
          </p>
        </div>

        {/* 3. COMPONENT CONTAINER */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 max-w-3xl mx-auto">
          <div className="p-6 sm:p-10">
            <ImageUpload />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
