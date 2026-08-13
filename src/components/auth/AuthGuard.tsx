'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Lock, User, ArrowRight, Shield, UserPlus } from 'lucide-react';
import type { SessionUser } from '@/lib/roles';

// ── Auth Context ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: SessionUser | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({ user: null, logout: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

// ── Videos for login background ─────────────────────────────────────────────

const VIDEOS = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
  '/videos/video5.mp4',
];

// ── AuthGuard Component ─────────────────────────────────────────────────────

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true); // initial session check
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Video carousel
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check existing session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Video carousel
  useEffect(() => {
    if (!user && !checking && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex, user, checking]);

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登录失败');
        setIsLoading(false);
        return;
      }

      setUser(data.user);
    } catch {
      setError('网络错误，请稍后重试');
      setIsLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName: displayName || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '注册失败');
        setIsLoading(false);
        return;
      }

      setUser(data.user);
    } catch {
      setError('网络错误，请稍后重试');
      setIsLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUsername('');
    setPassword('');
    setDisplayName('');
    setError('');
    setMode('login');
  };

  // ── Hydration check ───────────────────────────────────────────────────────

  if (checking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-blue-400/60 text-sm font-medium tracking-wider">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────

  if (user) {
    return (
      <AuthContext.Provider value={{ user, logout: handleLogout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // ── Login / Register screen ───────────────────────────────────────────────

  const isLogin = mode === 'login';
  const onSubmit = isLogin ? handleLogin : handleRegister;

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

      {/* Card */}
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

        {/* Form card */}
        <form
          onSubmit={onSubmit}
          className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl px-10 py-10 shadow-2xl shadow-black/5"
        >
          {/* Mode tabs */}
          <div className="flex mb-8 bg-gray-100/80 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              注册
            </button>
          </div>

          <div className="space-y-5">
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

            {/* Display Name (register only) */}
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  昵称 / Display Name <span className="text-gray-300">(可选)</span>
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-gray-200 rounded-xl text-gray-800 text-[15px] font-medium placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

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
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
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
                {isLogin ? '登 录' : '注 册'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-400/80 text-xs font-medium mt-8 tracking-wider">
          powered by <span className="font-bold text-gray-500">Hao</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">AI</span>
        </p>
      </div>
    </div>
  );
}
