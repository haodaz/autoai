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

// ── Videos for login background (from fanglue) ─────────────────────────────

const videoSlides = [
  '/videos/banner1.mp4',
  '/videos/banner2.mp4',
  '/videos/banner3.mp4',
  '/videos/banner4.mp4',
];

// ── Video Carousel Component ────────────────────────────────────────────────

function VideoCarouselBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isTransitioning = useRef(false);

  useEffect(() => {
    const vid = videoRefs.current[currentIndex];
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
    // WeChat / mobile autoplay
    const playVideo = () => vid?.play().catch(() => {});
    if (typeof window !== 'undefined') {
      document.addEventListener('touchstart', playVideo, { once: true });
    }
    return () => {};
  }, [currentIndex]);

  const handleTimeUpdate = (idx: number) => {
    if (idx !== currentIndex) return;
    const video = videoRefs.current[idx];
    if (!video || !video.duration) return;

    const fadeDuration = 1.2;
    if (video.duration - video.currentTime <= fadeDuration && !isTransitioning.current) {
      isTransitioning.current = true;
      const nextIdx = (currentIndex + 1) % videoSlides.length;
      setNextIndex(nextIdx);

      if (videoRefs.current[nextIdx]) {
        videoRefs.current[nextIdx]!.currentTime = 0;
        videoRefs.current[nextIdx]!.play().catch(() => {});
      }
      setIsFading(true);

      setTimeout(() => {
        setCurrentIndex(nextIdx);
        setIsFading(false);
        isTransitioning.current = false;
      }, fadeDuration * 1000);
    }
  };

  return (
    <>
      {videoSlides.map((src, idx) => {
        const isActive = idx === currentIndex;
        const isNext = idx === nextIndex;
        let opacityClass = 'opacity-0';
        if (isActive) {
          opacityClass = isFading
            ? 'opacity-0 transition-opacity duration-[1200ms] ease-out'
            : 'opacity-100';
        } else if (isNext && isFading) {
          opacityClass = 'opacity-100 transition-opacity duration-[1200ms] ease-in';
        }

        return (
          <div key={idx} className={`absolute inset-0 ${opacityClass}`}
            style={{ zIndex: isActive ? 1 : (isNext && isFading ? 2 : 0) }}
          >
            <video
              ref={el => { videoRefs.current[idx] = el; }}
              src={src}
              autoPlay
              muted
              playsInline
              loop={false}
              onTimeUpdate={() => handleTimeUpdate(idx)}
              className="object-cover w-full h-full"
            />
          </div>
        );
      })}
      {/* Light frosted overlay for form readability */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[4px]" style={{ zIndex: 3 }} />
    </>
  );
}

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

  // Check existing session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

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
      <VideoCarouselBackground />

      {/* Card */}
      <div className="relative w-full max-w-lg mx-4" style={{ zIndex: 10 }}>
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-5 shadow-xl shadow-blue-600/25 hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-black text-white tracking-tight">平方</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight drop-shadow-sm">
            平方创想教育科技
          </h1>
          <p className="text-gray-500 text-sm font-semibold mt-1.5 tracking-wide">
            Auto<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 font-black">ffice</span> · 平方工作台
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
