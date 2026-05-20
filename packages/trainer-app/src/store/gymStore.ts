// Zustand gym context store — loaded from JWT memberships on app boot (P1A)
import { create } from 'zustand';

export interface GymMembership {
  gym_id: string;
  role: 'owner' | 'trainer' | 'client';
  status: string;
}

export interface GymContext {
  id: string;
  slug: string;
  name: string;
  type: 'solo' | 'studio' | 'gym';
  owner_user_id: string;
  kvk_number?: string;
  vat_number?: string;
  iban?: string;
  address_json?: Record<string, string>;
  kor_active: boolean;
  subscription_tier: string;
  dpa_acknowledged_at_ms?: number;
  dpa_version?: string;
}

interface AuthState {
  token: string | null;
  userId: string | null;
  memberships: GymMembership[];
  activeGymId: string | null;
  activeRole: string | null;
  gym: GymContext | null;
  isLoading: boolean;
  setAuth: (token: string, userId: string, memberships: GymMembership[]) => void;
  setActiveGym: (gymId: string, role: string) => void;
  setGym: (gym: GymContext) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

const TOKEN_KEY = 'jft_token';
const USER_KEY  = 'jft_user_id';
const GYM_KEY   = 'jft_gym_id';

export const useGymStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  userId: localStorage.getItem(USER_KEY),
  memberships: [],
  activeGymId: localStorage.getItem(GYM_KEY),
  activeRole: null,
  gym: null,
  isLoading: false,

  setAuth: (token, userId, memberships) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userId);
    // Auto-pick first owner membership
    const ownerMem = memberships.find(m => m.role === 'owner' && m.status === 'active');
    const firstMem = memberships[0];
    const activeGymId = ownerMem?.gym_id ?? firstMem?.gym_id ?? null;
    const activeRole = ownerMem?.role ?? firstMem?.role ?? null;
    if (activeGymId) localStorage.setItem(GYM_KEY, activeGymId);
    set({ token, userId, memberships, activeGymId, activeRole });
  },

  setActiveGym: (gymId, role) => {
    localStorage.setItem(GYM_KEY, gymId);
    set({ activeGymId: gymId, activeRole: role });
  },

  setGym: (gym) => set({ gym }),

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GYM_KEY);
    set({ token: null, userId: null, memberships: [], activeGymId: null, activeRole: null, gym: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
