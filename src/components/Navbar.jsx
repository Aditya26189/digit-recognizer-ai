import React from 'react';
import { LogOut, ScanLine, User } from 'lucide-react';

export default function Navbar({ user, onSignOut, onSignIn }) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 md:px-8 z-50 shadow-sm">
      {/* Logo Area */}
      <div className="flex items-center gap-2 text-gray-900">
        <div className="p-1.5 bg-indigo-600 rounded-lg">
          <ScanLine className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Digit<span className="text-indigo-600">Recognizer</span>
        </span>
      </div>

      {/* Auth Area */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-7 h-7 rounded-full border-2 border-indigo-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {user.displayName ? user.displayName[0] : 'U'}
                  </span>
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.displayName}
              </span>
            </div>
            
            <button
              onClick={onSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
          >
            <User className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

