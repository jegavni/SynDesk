import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { Message, SidebarItem } from '../types';

type ApiError = { response?: { data?: { message?: string } } };

interface ChatState {
  messages: Message[];
  users: SidebarItem[];
  selectedUser: SidebarItem | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  socket: Socket | null;
  onlineUsers: string[];

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image?: string; file?: string; fileType?: string }) => Promise<void>;
  createGroup: (name: string, members: string[]) => Promise<SidebarItem>;
  setSelectedUser: (selectedUser: SidebarItem | null) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  deleteMessage: (messageId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,
  onlineUsers: [],

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get<SidebarItem[]>('/messages/users');
      set({ users: res.data });
    } catch (error: unknown) {
      const msg = (error as ApiError)?.response?.data?.message || 'Error fetching users';
      useAuthStore.getState().showToast(msg, 'error');
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get<Message[]>(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: unknown) {
      const msg = (error as ApiError)?.response?.data?.message || 'Error fetching messages';
      useAuthStore.getState().showToast(msg, 'error');
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: { text?: string; image?: string; file?: string; fileType?: string }) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    try {
      const payload = {
        ...messageData,
        isGroupMessage: !!selectedUser.isGroup,
      };
      const res = await axiosInstance.post<Message>(`/messages/send/${selectedUser._id}`, payload);
      set({ messages: [...messages, res.data] });
    } catch (error: unknown) {
      const msg = (error as ApiError)?.response?.data?.message || 'Error sending message';
      useAuthStore.getState().showToast(msg, 'error');
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({ messages: get().messages.filter(m => m._id !== messageId) });
    } catch (error: unknown) {
      const msg = (error as ApiError)?.response?.data?.message || 'Error deleting message';
      useAuthStore.getState().showToast(msg, 'error');
    }
  },

  createGroup: async (name, members) => {
    try {
      const res = await axiosInstance.post<SidebarItem>('/messages/groups', { name, members });
      set({ users: [res.data, ...get().users] });
      useAuthStore.getState().showToast('Group created successfully!', 'success');
      return res.data;
    } catch (error: unknown) {
      const msg = (error as ApiError)?.response?.data?.message || 'Error creating group';
      useAuthStore.getState().showToast(msg, 'error');
      throw error;
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  connectSocket: () => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser || get().socket?.connected) return;

    const isProd = import.meta.env.PROD;
    const baseUrl = isProd 
      ? '/' 
      : import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '/';
    const socket = io(baseUrl, {
      query: {
        userId: authUser._id,
      },
    });

    socket.connect();
    set({ socket });

    socket.on('getOnlineUsers', (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.disconnect();
    }
    set({ socket: null });
  },

  subscribeToMessages: () => {
    const { selectedUser, socket } = get();
    if (!selectedUser || !socket) return;

    socket.on('newMessage', (newMessage: Message) => {
      const isFromSelectedUser = selectedUser.isGroup
        ? newMessage.receiverId === selectedUser._id
        : newMessage.senderId === selectedUser._id;

      if (!isFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      set({ messages: get().messages.filter((m) => m._id !== messageId) });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = get().socket;
    if (socket) {
      socket.off('newMessage');
      socket.off('messageDeleted');
    }
  },
}));
