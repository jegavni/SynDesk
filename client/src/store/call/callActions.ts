import { useChatStore } from '../useChatStore';
import { SidebarUser } from '../../types';
import { CallState  } from '../useCallStore';
import type { StoreApi } from 'zustand/vanilla';
import {
  pc,
  isEndingCall, setIsEndingCall,
  cleanupPeerConnection,
  stopStream,
  addQueuedCandidates,
  idleState,
} from './webrtc';
import { createPeerConnection } from './socketHandlers';
type SetFn = StoreApi<CallState>['setState'];
type GetFn = StoreApi<CallState>['getState'];

// Module-level lock: prevents a second initiateCall() from running
// while the first is still awaiting getUserMedia / setLocalDescription.
// This is necessary because zustand state updates are asynchronous and
// the callState guard alone has a race window during the media prompt.
let isInitiatingCall = false;

/**
 * Start a new voice/video call.
 */
export const buildInitiateCall =
  (set: SetFn, get: GetFn) =>
  async (targetUser: SidebarUser, type: 'voice' | 'video') => {
    // Hard guard 1: module-level synchronous lock
    if (isInitiatingCall) {
      console.warn('Call initiation already in progress — ignoring duplicate request');
      return;
    }

    // Hard guard 2: zustand state check
    if (get().callState !== 'idle') {
      console.warn('Already in a call — ignoring call request');
      return;
    }

    const socket = useChatStore.getState().socket;
    if (!socket) { console.error('Socket is not connected'); return; }

    isInitiatingCall = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      const { remoteStream } = createPeerConnection(targetUser._id, stream, set, get, socket);

      const offer = await pc!.createOffer();
      await pc!.setLocalDescription(offer);

      set({
        callState: 'calling',
        callType: type,
        targetUser,
        localStream: stream,
        remoteStream,
        incomingSignal: null,
        isMuted: false,
        isVideoOff: false,
      });

      socket.emit('call-user', { to: targetUser._id, signal: offer, type });
    } catch (error) {
      console.error('Failed to initiate call:', error);
      stopStream(get().localStream);
      cleanupPeerConnection();
      set(idleState());
    } finally {
      // Always release the lock so future calls can proceed
      isInitiatingCall = false;
    }
  };

/**
 * Accept an incoming call.
 */
export const buildAcceptCall = (set: SetFn, get: GetFn) => async () => {
  const { targetUser, incomingSignal, callType } = get();
  const socket = useChatStore.getState().socket;

  if (!socket) { console.error('Socket is not connected'); return; }
  if (!targetUser) { console.error('No caller found'); return; }
  if (!incomingSignal) { console.error('No incoming WebRTC signal found'); return; }
  if (!callType) { console.error('No call type found'); return; }

  try {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
    } catch (mediaErr) {
      if (callType === 'video') {
        console.warn('Video access failed on accept, falling back to audio-only stream:', mediaErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        throw mediaErr;
      }
    }

    const { remoteStream } = createPeerConnection(targetUser._id, stream, set, get, socket);

    await pc!.setRemoteDescription({
      type: incomingSignal.type!,
      sdp: incomingSignal.sdp,
    });
    await addQueuedCandidates();

    const answer = await pc!.createAnswer();
    await pc!.setLocalDescription(answer);

    socket.emit('answer-call', { to: targetUser._id, signal: answer });

    set({
      callState: 'connected',
      localStream: stream,
      remoteStream,
      incomingSignal: null,
      isMuted: false,
      isVideoOff: false,
    });
  } catch (error) {
    console.error('Failed to accept call:', error);
    stopStream(get().localStream);
    cleanupPeerConnection();
    set(idleState());
  }
};

/**
 * Reject an incoming call.
 */
export const buildRejectCall = (set: SetFn, get: GetFn) => () => {
  const { targetUser } = get();
  const socket = useChatStore.getState().socket;

  if (socket && targetUser) {
    socket.emit('reject-call', { to: targetUser._id });
  }

  stopStream(get().localStream);
  stopStream(get().remoteStream);
  cleanupPeerConnection();
  set(idleState());
};

/**
 * End the current call (locally initiated).
 */
export const buildEndCall = (set: SetFn, get: GetFn) => () => {
  if (isEndingCall) return;
  setIsEndingCall(true);

  try {
    const { targetUser, localStream, remoteStream, callState } = get();
    const socket = useChatStore.getState().socket;

    if (socket && targetUser) {
      if (callState === 'connected' || callState === 'calling') {
        socket.emit('end-call', { to: targetUser._id });
      } else if (callState === 'incoming') {
        socket.emit('reject-call', { to: targetUser._id });
      }
    }

    stopStream(localStream);
    stopStream(remoteStream);   // release remote tracks too
    cleanupPeerConnection();
    set(idleState());
  } finally {
    setIsEndingCall(false);
  }
};

/**
 * Mute / unmute microphone.
 */
export const buildToggleMute = (set: SetFn, get: GetFn) => () => {
  const { localStream, isMuted } = get();
  if (!localStream) return;

  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) return;

  audioTracks.forEach((track: MediaStreamTrack) => { track.enabled = isMuted; });
  set({ isMuted: !isMuted });
};

/**
 * Turn camera on / off.
 */
export const buildToggleVideo = (set: SetFn, get: GetFn) => () => {
  const { localStream, isVideoOff } = get();
  if (!localStream) return;

  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length === 0) return;

  videoTracks.forEach((track: MediaStreamTrack) => { track.enabled = isVideoOff; });
  set({ isVideoOff: !isVideoOff });
};
