import { useState, useEffect } from 'react'
import { auth, googleProvider } from './config/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import ImageUpload from './ImageUpload'

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

const SignInPage = ({ onSignIn }) => (
  <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-center px-4 py-10 overflow-hidden">
    <AnimatedBg />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
    <div className="absolute inset-x-0 bottom-[-40%] h-[70%] bg-gradient-to-t from-blue-900/30 to-transparent blur-[120px]" />

    <div className="relative z-10 w-full max-w-[400px] text-center space-y-8 p-10 rounded-[32px] bg-white/5 border border-white/10 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-900/30">
        ⚡
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">AI-powered handwritten digit analysis.</h1>
      </div>

      <button
        onClick={onSignIn}
        className="group w-full flex items-center justify-center gap-3 rounded-2xl bg-white text-gray-900 font-semibold py-3.5 shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5"
        style={{ minHeight: '52px' }}
      >
        Continue with Google
      </button>

      <p className="text-xs text-white/50">No passwords. Just a secure Google sign in.</p>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
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

  const navBarClasses = `flex items-center justify-between transition-all duration-300 px-6 ${
        scrolled ? 'max-w-4xl mx-auto w-[90%] mt-4 rounded-full bg-gray-900/80 backdrop-blur-md border border-gray-700 shadow-2xl py-3' : 'w-full bg-transparent border-b border-gray-800/50 py-4'
  }`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <SignInPage onSignIn={handleGoogleSignIn} />
  }

  return (
    <div className="min-h-screen bg-bg-deep relative overflow-x-hidden">
      <BackgroundBlobs />
      <AnimatedBg />
      <div className="bg-noise" />
      
      <header className="relative w-full z-20 px-4 pt-6">
        <nav className={`${navBarClasses} flex items-center gap-4`}>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold tracking-tight text-white">AI-Powered Digit Recognition</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="w-[150px] text-sm sm:text-base font-semibold bg-brand-orange/90 hover:bg-brand-orange text-white px-4 py-2.5 rounded-full transition shadow-lg shadow-orange-900/30 flex items-center justify-center"
          >
            <h2 className="text-base font-semibold">Sign Out</h2>
          </button>
        </nav>
      </header>
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 md:pb-20 flex flex-col items-center">
        <div className="text-center mb-12 max-w-3xl">
          <h3 className="text-lg md:text-xl text-text-secondary max-w-[60ch] mx-auto font-normal">
            Upload an image of a handwritten digit and let AI identify it instantly
          </h3>
        </div>

        <ImageUpload />
      </main>
    </div>
  )
}

export default App
