'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  loggedIn: boolean;
  username?: string;
  displayName?: string;
  uid?: number;
  isAdmin?: boolean;
  isLocal?: boolean;
}

let cachedUser: AuthUser | null = null;
let fetchPromise: Promise<AuthUser> | null = null;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function fetchAuthUser(): Promise<AuthUser> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : { loggedIn: false })
    .catch(() => ({ loggedIn: false }))
    .finally(() => { fetchPromise = null; });
  const user = await fetchPromise;
  cachedUser = user;
  notifyListeners();
  return user;
}

/** 手动刷新认证状态（登录/退出后调用） */
export function refreshAuth() {
  cachedUser = null;
  fetchAuthUser();
}

/**
 * useAuth — 全局共享认证状态 hook
 * 多个组件调用只发一次请求，登录后 refreshAuth() 全局同步
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);

  const sync = useCallback(() => {
    setUser(cachedUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    listeners.add(sync);
    if (!cachedUser) {
      setIsLoading(true);
      fetchAuthUser().then(u => {
        setUser(u);
        setIsLoading(false);
      });
    }
    return () => { listeners.delete(sync); };
  }, [sync]);

  const isGuest = !isLoading && (!user || !user.loggedIn);

  return { user, isGuest, isLoading };
}
