import React, { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function ProfileChip({ user, onSignOut }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!user) return null;

  const getInitial = () => {
    if (user.displayName) return user.displayName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Circle */}
      <div className="w-11 h-11 rounded-full bg-brand-orange flex items-center justify-center ring-2 ring-[#111219] shadow-lg">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-white font-semibold text-base">
            {getInitial()}
          </span>
        )}
      </div>

      {/* Sign Out Pill */}
      <button
        onClick={onSignOut}
        aria-label="Sign out"
        className={`
          flex items-center gap-1.5 px-3 py-2 
          bg-slate-800/90 backdrop-blur-sm 
          rounded-full text-text-secondary text-sm font-medium
          transition-all duration-250
          ring-1 ring-white/10 shadow-md
          hover:bg-slate-700 hover:text-white
          focus:outline-none focus:ring-2 focus:ring-brand-orange/40
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
        `}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs uppercase tracking-wide font-semibold">Sign out</span>
      </button>
    </div>
  );
}
