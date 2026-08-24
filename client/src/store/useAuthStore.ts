import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { AuthUser } from '../types';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface AuthState {
  authUser: AuthUser | null;
  isCheckingAuth: boolean;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isUpdatingProfile: boolean;
  toast: Toast | null;
  checkAuth: () => Promise<void>;
  signup: (data: { username: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<AuthUser, 'username' | 'bio' | 'profilePic' | 'lastSeenPrivacy'>>) => Promise<AuthUser>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  clearToast: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  isUpdatingProfile: false,
  toast: null,

  showToast: (message, type = 'error') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      get().clearToast();
    }, 4000);
  },

  clearToast: () => set({ toast: null }),

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<AuthUser>('/auth/check');
      set({ authUser: res.data });
    } catch (error: unknown) {
      console.log('Error in checkAuth', error);
      set({ authUser: null });
      // Only show error toast if there was a token present (i.e. not during initial load of unauthenticated user)
      if (document.cookie.includes('jwt')) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Session expired. Please log in again.';
        get().showToast(message, 'error');
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<AuthUser>('/auth/register', data);
      set({ authUser: res.data });
      get().showToast('Registered successfully!', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error signing up';
      get().showToast(message, 'error');
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post<AuthUser>('/auth/login', data);
      set({ authUser: res.data });
      get().showToast('Logged in successfully!', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error logging in';
      get().showToast(message, 'error');
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      set({ authUser: null });
      get().showToast('Logged out successfully!', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error logging out';
      get().showToast(message, 'error');
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put<AuthUser>('/auth/update-profile', data);
      set({ authUser: res.data });
      get().showToast('Profile updated successfully!', 'success');
      return res.data;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error updating profile';
      get().showToast(message, 'error');
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
}));
