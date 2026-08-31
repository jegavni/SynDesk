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
  typingUsers: Record<string, string[]>;

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
  sendTypingStatus: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,
  onlineUsers: [],
  typingUsers: {},

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

sendMessage: async (messageData) => {
  const { selectedUser } = get();

  if (!selectedUser) return;

  try {
    const payload = {
      ...messageData,
      isGroupMessage: !!selectedUser.isGroup,
    };

    await axiosInstance.post<Message>(
      `/messages/send/${selectedUser._id}`,
      payload
    );
  } catch (error: unknown) {
    const msg =
      (error as ApiError)?.response?.data?.message ||
      'Error sending message';

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

  const socketUrl = import.meta.env.PROD
  ? import.meta.env.VITE_SOCKET_URL
  : 'http://localhost:5000';
    const socket = io(socketUrl, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
    });

    set({ socket });

    socket.on('getOnlineUsers', (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    socket.on('typing', ({ chatId, senderName }: { chatId: string; senderId: string; senderName: string }) => {
      const current = get().typingUsers[chatId] || [];
      if (!current.includes(senderName)) {
        set({
          typingUsers: {
            ...get().typingUsers,
            [chatId]: [...current, senderName],
          },
        });
      }
    });

    socket.on('stop-typing', ({ chatId, senderName }: { chatId: string; senderId: string; senderName: string }) => {
      const current = get().typingUsers[chatId] || [];
      set({
        typingUsers: {
          ...get().typingUsers,
          [chatId]: current.filter((name) => name !== senderName),
        },
      });
    });

 socket.on('newMessage', (newMessage: Message) => {
  const { selectedUser } = get();

  if (!selectedUser) return;

  const isRelevant = selectedUser.isGroup
    ? newMessage.receiverId === selectedUser._id
    : newMessage.senderId === selectedUser._id;

  if (!isRelevant) return;

  set((state) => {
    const alreadyExists = state.messages.some(
      (message) => message._id === newMessage._id
    );

    if (alreadyExists) {
      return state;
    }

    return {
      messages: [...state.messages, newMessage],
    };
  });
});

    socket.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      set({ messages: get().messages.filter((m) => m._id !== messageId) });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null,
      onlineUsers: [],
      typingUsers: {},
     });
  },

  subscribeToMessages: () => {
    // Already handled globally on connection in connectSocket to prevent timing/closure bugs.
  },

  unsubscribeFromMessages: () => {
    // Cleaned up automatically on socket disconnection.
  },

  sendTypingStatus: (isTyping) => {
    const { selectedUser, socket } = get();
    if (!selectedUser || !socket) return;

    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    if (isTyping) {
      socket.emit('typing', {
        chatId: selectedUser._id,
        isGroup: !!selectedUser.isGroup,
        senderId: authUser._id,
        senderName: authUser.username,
      });
    } else {
      socket.emit('stop-typing', {
        chatId: selectedUser._id,
        isGroup: !!selectedUser.isGroup,
        senderId: authUser._id,
        senderName: authUser.username,
      });
    }
  },
}));
