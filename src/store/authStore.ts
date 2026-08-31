'use client';

import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, setAccessToken, getAccessToken, toApiError } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  /** True until the initial session restore finishes — gates route guards. */
  initialising: boolean;
  loading: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  signupStaff: (formData: FormData) => Promise<{ requiresApproval: boolean }>;
  acceptAdminInvite: (
    token: string,
    password: string,
    confirmPassword: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  updateAvailability: (status: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialising: true,
  loading: false,

  /**
   * Restores the session on first mount. Tries the in-memory/sessionStorage
   * token first, then falls back to the refresh cookie so a fresh tab or a
   * hard reload still lands the user logged in.
   */
  bootstrap: async () => {
    try {
      if (getAccessToken()) {
        const res = await apiGet<{ user: User }>('/auth/me');
        set({ user: res.data.user, initialising: false });
        return;
      }

      const res = await apiPost<{ user: User; accessToken: string }>('/auth/refresh');
      setAccessToken(res.data.accessToken);
      set({ user: res.data.user, initialising: false });
    } catch {
      setAccessToken(null);
      set({ user: null, initialising: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await apiPost<{ user: User; accessToken: string }>('/auth/login', {
        email,
        password,
      });
      setAccessToken(res.data.accessToken);
      set({ user: res.data.user, loading: false });
      return res.data.user;
    } catch (error) {
      set({ loading: false });
      throw toApiError(error);
    }
  },

  signupStaff: async (formData) => {
    set({ loading: true });
    try {
      const res = await apiPost<{ user: User; requiresApproval: boolean }>(
        '/auth/staff/signup',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      set({ loading: false });
      // No session is issued — the account is pending approval.
      return { requiresApproval: res.data.requiresApproval };
    } catch (error) {
      set({ loading: false });
      throw toApiError(error);
    }
  },

  acceptAdminInvite: async (token, password, confirmPassword) => {
    set({ loading: true });
    try {
      const res = await apiPost<{ user: User; accessToken: string }>(
        '/auth/admin/accept-invite',
        { token, password, confirmPassword },
      );
      setAccessToken(res.data.accessToken);
      set({ user: res.data.user, loading: false });
      return res.data.user;
    } catch (error) {
      set({ loading: false });
      throw toApiError(error);
    }
  },

  logout: async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // A failed logout call must still clear local state.
    }
    setAccessToken(null);
    set({ user: null });
  },

  setUser: (user) => set({ user }),

  refreshUser: async () => {
    try {
      const res = await apiGet<{ user: User }>('/auth/me');
      set({ user: res.data.user });
    } catch {
      // Leave the current user in place; the interceptor handles a dead session.
    }
  },

  updateAvailability: async (status) => {
    const previous = get().user;
    // Optimistic: the toggle should feel instant.
    if (previous) {
      set({ user: { ...previous, availabilityStatus: status as User['availabilityStatus'] } });
    }
    try {
      const res = await apiPatch<{ user: User }>('/auth/me/availability', {
        availabilityStatus: status,
      });
      set({ user: res.data.user });
    } catch (error) {
      set({ user: previous });
      throw toApiError(error);
    }
  },
}));
