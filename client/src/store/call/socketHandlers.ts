import { useChatStore } from '../useChatStore';
import { StoreApi } from 'zustand';
import { RTCSignal, SidebarUser } from '../../types';
import {
  pc, setPc, queuedCandidates,
  configuration,
  isEndingCall, setIsEndingCall,
  cleanupPeerConnection,
  stopStream,
  addQueuedCandidates,
  idleState,
} from './webrtc';
import { CallState } from '../useCallStore';
import { Socket } from 'socket.io-client';

type SetFn = StoreApi<CallState>['setState'];
type GetFn = StoreApi<CallState>['getState'];

/**
 * Register Socket.IO listeners for WebRTC signaling.
 * Designed to be called once per socket connection.
 */
export const buildSetupSocketListeners = (set: SetFn, get: GetFn) => () => {
  const socket = useChatStore.getState().socket;

  if (!socket) {
    console.warn('Socket is not available');
    return;
  }

  // Prevent duplicate listeners.
  socket.off('incoming-call');
  socket.off('call-answered');
  socket.off('ice-candidate');
  socket.off('call-rejected');
  socket.off('call-ended');

  /** Incoming call */
  socket.on(
    'incoming-call',
    ({ from, signal, type }: { from: string; signal: RTCSignal; type: 'voice' | 'video' }) => {
      const currentState = get();

      // Don't accept another call while already in one.
      if (currentState.callState !== 'idle') return;

      const users = useChatStore.getState().users;
      const callerUser = users.find((user) => user._id === from) as SidebarUser | undefined;

      if (!callerUser) {
        console.warn('Caller user not found:', from);
        return;
      }

      set({
        callState: 'incoming',
        callType: type,
        targetUser: callerUser,
        incomingSignal: signal,
        localStream: null,
        remoteStream: null,
        isMuted: false,
        isVideoOff: false,
      });
    },
  );

  /** Caller receives answer from receiver */
  socket.on('call-answered', async ({ signal }: { signal: RTCSessionDescriptionInit }) => {
    if (!pc) {
      console.warn('Received call answer but peer connection does not exist');
      return;
    }
    try {
      await pc.setRemoteDescription(signal);
      await addQueuedCandidates();
      set({ callState: 'connected' });
    } catch (error) {
      console.error('Error setting remote description:', error);
      get().endCall();
    }
  });

  /** Receive ICE candidate */
  socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    if (!candidate) return;

    if (!pc) {
      queuedCandidates.push(candidate);
      return;
    }

    if (pc.remoteDescription) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding received ICE candidate:', error);
      }
    } else {
      queuedCandidates.push(candidate);
    }
  });

  /** Caller receives rejection */
  socket.on('call-rejected', () => {
    cleanupPeerConnection();
    stopStream(get().localStream);
    set(idleState());
  });

  /** Other user ended the call — guarded to break the echo loop:
   *  onconnectionstatechange → endCall() → end-call → call-ended → endCall() → … */
  socket.on('call-ended', () => {
    if (isEndingCall) return;          // we already tore down locally
    setIsEndingCall(true);
    try {
      stopStream(get().localStream);
      cleanupPeerConnection();
      set(idleState());
    } finally {
      setIsEndingCall(false);
    }
  });
};

/**
 * Shared helper to set up a new RTCPeerConnection with tracks,
 * ICE candidate forwarding, remote stream collection, and
 * connection-state monitoring.
 */
export const createPeerConnection = (
  targetUserId: string,
  localStream: MediaStream,
  set: SetFn,
  get: GetFn,
  socket: Socket,
) => {
  cleanupPeerConnection();
  const newPc = new RTCPeerConnection(configuration);
  setPc(newPc);

  localStream.getTracks().forEach((track) => newPc.addTrack(track, localStream));

  newPc.onicecandidate = (event) => {
    if (!event.candidate) return;
    socket.emit('ice-candidate', { to: targetUserId, candidate: event.candidate.toJSON() });
  };

  const remoteStream = new MediaStream();
  newPc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => {
      if (!remoteStream.getTrackById(track.id)) remoteStream.addTrack(track);
    });
    set({ remoteStream });
  };

  newPc.onconnectionstatechange = () => {
    if (!newPc) return;
    console.log('WebRTC connection state:', newPc.connectionState);
    if (newPc.connectionState === 'failed' || newPc.connectionState === 'closed') {
      get().endCall();
    }
  };

  return { newPc, remoteStream };
};
