import { create } from 'zustand';
import { RTCSignal, SidebarUser } from '../types';
import { buildSetupSocketListeners } from './call/socketHandlers';
import {
  buildInitiateCall,
  buildAcceptCall,
  buildRejectCall,
  buildEndCall,
  buildToggleMute,
  buildToggleVideo,
} from './call/callActions';

export interface CallState {
  callState: 'idle' | 'calling' | 'incoming' | 'connected';
  callType: 'voice' | 'video' | null;
  targetUser: SidebarUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  incomingSignal: RTCSignal | null;

  initiateCall: (targetUser: SidebarUser, type: 'voice' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setupSocketListeners: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  callState: 'idle',
  callType: null,
  targetUser: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  incomingSignal: null,

  // ── Actions ────────────────────────────────────────────────────────────────
  setupSocketListeners: buildSetupSocketListeners(set, get),
  initiateCall:         buildInitiateCall(set, get),
  acceptCall:           buildAcceptCall(set, get),
  rejectCall:           buildRejectCall(set, get),
  endCall:              buildEndCall(set, get),
  toggleMute:           buildToggleMute(set, get),
  toggleVideo:          buildToggleVideo(set, get),
}));
