// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  profilePic: string;
  bio: string;
  isOnline: boolean;
  lastSeen: string;
  lastSeenPrivacy: 'everyone' | 'nobody';
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  fileUrl?: string;
  fileType?: 'image' | 'video' | 'audio' | 'file';
  isGroupMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Users / Groups (sidebar) ─────────────────────────────────────────────────

export interface SidebarUser extends AuthUser {
  isGroup: false;
}

export interface SidebarGroup {
  _id: string;
  name: string;
  username: string; // alias for name, added by server
  creator: string;
  members: string[];
  isGroup: true;
  createdAt: string;
  updatedAt: string;
}

export type SidebarItem = SidebarUser | SidebarGroup;

// ─── Calls ────────────────────────────────────────────────────────────────────

export interface CallParticipant {
  _id: string;
  username: string;
  profilePic: string;
}

export interface CallLog {
  _id: string;
  caller: CallParticipant;
  receiver: CallParticipant;
  type: 'voice' | 'video';
  status: 'missed' | 'rejected' | 'answered';
  duration: number;
  createdAt: string;
  updatedAt: string;
}

// ─── WebRTC Signaling ─────────────────────────────────────────────────────────

export interface RTCSignal {
  type?: RTCSdpType;
  sdp?: string;
}
