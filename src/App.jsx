import { useState, useEffect } from 'react'
import { auth, googleProvider } from './config/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import ImageUpload from './ImageUpload'
import ProfileChip from './components/ProfileChip'
import { Lock } from 'lucide-react'

// Background Blobs Component
const BackgroundBlobs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[80px] animate-float" style={{ animationDuration: '14s' }} />
    <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[60px] animate-float" style={{ animationDuration: '12s', animationDelay: '2s' }} />
    <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-[100px] animate-float" style={{ animationDuration: '18s', animationDelay: '1s' }} />
  </div>
);

const AnimatedBg = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 1440 600"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ zIndex: 0 }}
  >
    <circle cx="200" cy="100" r="60" fill="#3b82f6" fillOpacity="0.2">
      <animate attributeName="cy" values="100;120;100" dur="8s" repeatCount="indefinite" />
    </circle>
    <circle cx="1200" cy="200" r="40" fill="#8b5cf6" fillOpacity="0.3">
      <animate attributeName="cy" values="200;220;200" dur="8s" repeatCount="indefinite" />
    </circle>
    <circle cx="700" cy="500" r="80" fill="#60a5fa" fillOpacity="0.1">
      <animate attributeName="cy" values="500;520;500" dur="8s" repeatCount="indefinite" />
    </circle>
  </svg>
);

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
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-deep text-text-primary p-4 relative overflow-hidden">
        <BackgroundBlobs />
        <AnimatedBg />
        <div className="bg-noise" />
        
        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div>
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-brand-orange to-orange-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-orange-900/20">
              ⚡
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-text-primary">
              Digit Recognizer
            </h2>
            <p className="mt-2 text-text-secondary">
              Sign in to access the AI-powered identification tool
            </p>
          </div>
          
          {/* Warning Badge */}
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Sign in required for AI Analysis</span>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-brand-orange hover:bg-brand-orange-dark transition-all shadow-lg hover:shadow-orange-900/20 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 active:scale-[0.98]"
            style={{ minHeight: '44px' }}
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-bg-deep relative overflow-x-hidden">
      <BackgroundBlobs />
      <AnimatedBg />
      <div className="bg-noise" />
      
      <ProfileChip user={user} onSignOut={handleSignOut} />
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center">
        <div className="text-center mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-[52px] font-bold text-text-primary tracking-tight mb-4 leading-tight">
            AI-Powered Digit Recognition
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-[60ch] mx-auto font-normal">
            Upload an image of a handwritten digit and let AI identify it instantly
          </p>
        </div>

        <ImageUpload />
      </main>
    </div>
  )
}

export default App
