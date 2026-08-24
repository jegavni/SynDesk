import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';
import { CallLog } from '../types';

type ApiError = { response?: { data?: { message?: string } } };

interface CallLogState {
  callLogs: CallLog[];
  isLoadingCallLogs: boolean;
  getCallLogs: () => Promise<void>;
  subscribeToCallLogs: () => void;
  unsubscribeFromCallLogs: () => void;
}

export const useCallLogStore = create<CallLogState>((set) => ({
  callLogs: [],
  isLoadingCallLogs: false,

  getCallLogs: async () => {
    set({ isLoadingCallLogs: true });
    try {
      const res = await axiosInstance.get<CallLog[]>('/calls');
      set({ callLogs: res.data });
    } catch (error: unknown) {
      const msg = (error as ApiError)?.response?.data?.message || 'Error fetching call logs';
      useAuthStore.getState().showToast(msg, 'error');
    } finally {
      set({ isLoadingCallLogs: false });
    }
  },

  subscribeToCallLogs: () => {
    const socket = useChatStore.getState().socket;
    if (!socket) return;

    socket.off('callLogUpdated');

    socket.on('callLogUpdated', (updatedLog: CallLog) => {
      set((state) => {
        const existingIndex = state.callLogs.findIndex((log) => log._id === updatedLog._id);

        if (existingIndex !== -1) {
          // Update existing log in-place
          const updated = [...state.callLogs];
          updated[existingIndex] = updatedLog;
          return { callLogs: updated };
        } else {
          // New log — prepend (most recent first)
          return { callLogs: [updatedLog, ...state.callLogs] };
        }
      });
    });
  },

  unsubscribeFromCallLogs: () => {
    const socket = useChatStore.getState().socket;
    if (socket) {
      socket.off('callLogUpdated');
    }
  },
}));
