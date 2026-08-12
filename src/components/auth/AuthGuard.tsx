'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, User, ArrowRight, Zap, Shield } from 'lucide-react';

const VALID_USERNAME = 'haoz214';
const VALID_PASSWORD = '198749';
const AUTH_KEY = 'autoffice_auth';

const VIDEOS = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
  '/videos/video5.mp4',
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Video carousel state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    setIsAuthed(stored === 'true');
  }, []);

  // Video carousel: load & play on index change
  useEffect(() => {
    if (isAuthed === false && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex, isAuthed]);

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 600));

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthed(true);
    } else {
      setError('账号或密码不正确');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthed(false);
  };

  // Hydration check
  if (isAuthed === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-blue-400/60 text-sm font-medium tracking-wider">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  // Authenticated
  if (isAuthed) {
    return <AuthContext.Provider value={{ logout: handleLogout }}>{children}</AuthContext.Provider>;
  }

  // Login screen — light theme with video background
  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-gray-100">

      {/* Background video carousel */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className="absolute top-0 left-0 w-full h-full object-cover z-0 scale-[1.35] transition-opacity duration-1000"
      >
        <source src={VIDEOS[currentVideoIndex]} type="video/mp4" />
      </video>

      {/* Light frosted overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-white/40 backdrop-blur-[3px] z-[1]" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-5 shadow-xl shadow-blue-600/25 hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-black text-white tracking-tight">BEP</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight drop-shadow-sm">
            Bristh Enrollment Partners
          </h1>
          <p className="text-gray-500 text-sm font-semibold mt-1.5 tracking-wide">
            Auto<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 font-black">ffice</span> · Multi-Agent Workspace
          </p>
        </div>

        {/* Form card — frosted glass, enlarged */}
        <form
          onSubmit={handleLogin}
          className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl px-10 py-10 shadow-2xl shadow-black/5"
        >
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                账号 / Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-gray-200 rounded-xl text-gray-800 text-[15px] font-medium placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                密码 / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-gray-200 rounded-xl text-gray-800 text-[15px] font-medium placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-center text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <Shield className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="mt-8 w-full flex items-center justify-center py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[15px] font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                登 录
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer — powered by HaoAI */}
        <p className="text-center text-gray-400/80 text-xs font-medium mt-8 tracking-wider">
          powered by <span className="font-bold text-gray-500">Hao</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">AI</span>
        </p>
      </div>
    </div>
  );
}

// Context for logout, usable by sidebar etc.
export const AuthContext = React.createContext<{ logout: () => void }>({ logout: () => {} });
