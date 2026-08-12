'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  username?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

let cachedProfile: UserProfile | null = null;
let fetchPromise: Promise<UserProfile> | null = null;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function fetchUserProfile(): Promise<UserProfile> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch(`/api/profile?t=${Date.now()}`)
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}))
    .finally(() => { fetchPromise = null; });
  const profile = await fetchPromise;
  cachedProfile = profile;
  notifyListeners();
  return profile;
}

export function refreshProfile() {
  cachedProfile = null;
  fetchUserProfile();
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [isLoading, setIsLoading] = useState(!cachedProfile);

  const sync = useCallback(() => {
    setProfile(cachedProfile);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    listeners.add(sync);
    if (!cachedProfile) {
      setIsLoading(true);
      fetchUserProfile().then(p => {
        setProfile(p);
        setIsLoading(false);
      });
    }
    return () => { listeners.delete(sync); };
  }, [sync]);

  return { profile, isLoading };
}
