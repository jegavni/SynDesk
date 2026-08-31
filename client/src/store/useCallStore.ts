import { create } from 'zustand';
import { useChatStore } from './useChatStore';
import { RTCSignal, SidebarUser } from '../types';

const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface CallState {
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

let queuedCandidates: RTCIceCandidateInit[] = [];
let pc: RTCPeerConnection | null = null;

export const useCallStore = create<CallState>((set, get) => ({
  callState: 'idle',
  callType: null,
  targetUser: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  incomingSignal: null,

  setupSocketListeners: () => {
    const socket = useChatStore.getState().socket;
    if (!socket) return;

    socket.off('incoming-call');
    socket.off('call-answered');
    socket.off('ice-candidate');
    socket.off('call-rejected');
    socket.off('call-ended');

    socket.on('incoming-call', ({ from, signal, type }: { from: string; signal: RTCSignal; type: 'voice' | 'video' }) => {
      const users = useChatStore.getState().users;
      const callerUser = users.find((u) => u._id === from) as SidebarUser | undefined;
      if (callerUser) {
        set({
          callState: 'incoming',
          callType: type,
          targetUser: callerUser,
          incomingSignal: signal,
        });
      }
    });

    socket.on('call-answered', async ({ signal }: { signal: RTCSessionDescriptionInit }) => {
      if (pc) {
        set({ callState: 'connected' });
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          for (const candidate of queuedCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Error adding queued ice candidate', e);
            }
          }
          queuedCandidates = [];
        } catch (e) {
          console.error('Error setting remote description on call-answered', e);
        }
      }
    });

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        queuedCandidates.push(candidate);
      }
    });

    socket.on('call-rejected', () => {
      get().endCall();
    });

    socket.on('call-ended', () => {
      get().endCall();
    });
  },

  initiateCall: async (targetUser, type) => {
    const socket = useChatStore.getState().socket;
    if (!socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });

      pc = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => {
        pc!.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        set({ remoteStream });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      set({
        callState: 'calling',
        callType: type,
        targetUser,
        localStream: stream,
        remoteStream,
      });

      socket.emit('call-user', {
        to: targetUser._id,
        signal: offer,
        type,
      });
    } catch (err) {
      console.error('Failed to initiate call:', err);
      get().endCall();
    }
  },

  acceptCall: async () => {
    const { targetUser, incomingSignal, callType } = get();
    const socket = useChatStore.getState().socket;
    if (!socket || !targetUser || !incomingSignal) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      });

      pc = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => {
        pc!.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        set({ remoteStream });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      for (const candidate of queuedCandidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding queued ice candidate', e);
        }
      }
      queuedCandidates = [];

      socket.emit('answer-call', {
        to: targetUser._id,
        signal: answer,
      });

      set({
        callState: 'connected',
        localStream: stream,
        remoteStream,
      });
    } catch (err) {
      console.error('Failed to accept call:', err);
      get().endCall();
    }
  },

  rejectCall: () => {
    const { targetUser } = get();
    const socket = useChatStore.getState().socket;
    if (socket && targetUser) {
      socket.emit('reject-call', { to: targetUser._id });
    }
    get().endCall();
  },

  endCall: () => {
    const { targetUser, localStream, callState } = get();
    const socket = useChatStore.getState().socket;
    if (socket && targetUser) {
      if (callState === 'connected' || callState === 'calling') {
        socket.emit('end-call', { to: targetUser._id });
      } else if (callState === 'incoming') {
        socket.emit('reject-call', { to: targetUser._id });
      }
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (pc) {
      pc.close();
      pc = null;
    }

    queuedCandidates = [];

    set({
      callState: 'idle',
      callType: null,
      targetUser: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      incomingSignal: null,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      set({ isVideoOff: !isVideoOff });
    }
  },
}));
