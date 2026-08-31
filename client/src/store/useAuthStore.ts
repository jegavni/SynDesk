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
    set({ isCheckingAuth: true });
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // No stored token: check if an httpOnly refresh-token cookie exists to restore session
        try {
          const refreshRes = await axiosInstance.post<{ accessToken: string }>('/auth/refresh');
          if (refreshRes.data.accessToken) {
            localStorage.setItem('accessToken', refreshRes.data.accessToken);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${refreshRes.data.accessToken}`;
            const userRes = await axiosInstance.get<AuthUser>('/auth/check');
            set({ authUser: userRes.data });
            return;
          }
        } catch {
          // Guest / not logged in
          set({ authUser: null });
          return;
        }
      } else {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const res = await axiosInstance.get<AuthUser>('/auth/check');
      set({ authUser: res.data });
    } catch {
      set({ authUser: null });
      localStorage.removeItem('accessToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<AuthUser & { accessToken?: string }>('/auth/register', data);
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
      }
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
      const res = await axiosInstance.post<AuthUser & { accessToken?: string }>('/auth/login', data);
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
      }
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
    } catch {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('accessToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      set({ authUser: null });
      get().showToast('Logged out successfully!', 'success');
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
