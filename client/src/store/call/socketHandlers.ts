import { useChatStore } from '../useChatStore';
import { StoreApi } from 'zustand';
import { RTCSignal, SidebarUser } from '../../types';

import {
  pc,
  setPc,
  queuedCandidates,
  configuration,
  isEndingCall,
  setIsEndingCall,
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
 *
 * This should be called once whenever the Socket.IO connection
 * becomes available.
 */
export const buildSetupSocketListeners =
  (set: SetFn, get: GetFn) => () => {
    const socket = useChatStore.getState().socket;

    if (!socket) {
      console.warn('[WebRTC] Socket is not available');
      return;
    }

    // Prevent duplicate listeners.
    socket.off('incoming-call');
    socket.off('call-answered');
    socket.off('ice-candidate');
    socket.off('call-rejected');
    socket.off('call-ended');
    socket.off('call-failed');

    // ============================================================
    // CALL FAILED
    // ============================================================

    socket.on('call-failed', ({ message }: { message?: string } = {}) => {
      console.warn('[WebRTC] Call failed:', message);
      if (message) {
        alert(message);
      }
      get().endCall();
    });

    // ============================================================
    // INCOMING CALL
    // ============================================================

    socket.on(
      'incoming-call',
      ({
        from,
        caller,
        signal,
        type,
      }: {
        from: string;
        caller?: { _id: string; username: string; profilePic?: string };
        signal: RTCSignal;
        type: 'voice' | 'video';
      }) => {
        const currentState = get();

        const users = useChatStore.getState().users;

        let callerUser = users.find(
          (user) => user._id === from,
        ) as SidebarUser | undefined;

        if (!callerUser && caller) {
          callerUser = {
            _id: caller._id,
            username: caller.username,
            profilePic: caller.profilePic || '',
            isGroup: false,
          } as SidebarUser;
        }

        if (!callerUser) {
          callerUser = {
            _id: from,
            username: 'User',
            profilePic: '',
            isGroup: false,
          } as SidebarUser;
        }

        /**
         * If already in another call, reject the new call.
         */
        if (currentState.callState !== 'idle') {
          console.log(
            '[WebRTC] Rejecting incoming call because already in call:',
            currentState.callState,
          );

          socket.emit('reject-call', {
            to: from,
            reason: 'busy',
          });

          return;
        }

        console.log(
          '[WebRTC] Incoming call:',
          type,
          'from:',
          callerUser.username,
        );

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

    // ============================================================
    // CALL ANSWERED
    // ============================================================

    socket.on(
      'call-answered',
      async ({
        signal,
      }: {
        signal: RTCSessionDescriptionInit;
      }) => {
        if (!pc) {
          console.warn(
            '[WebRTC] Received answer but peer connection does not exist',
          );
          return;
        }

        try {
          console.log(
            '[WebRTC] Received call answer',
          );

          await pc.setRemoteDescription(
            new RTCSessionDescription(signal),
          );

          console.log(
            '[WebRTC] Remote description set:',
            pc.remoteDescription?.type,
          );

          /**
           * ICE candidates that arrived before the
           * remote description was available.
           */
          await addQueuedCandidates();

          console.log(
            '[WebRTC] Queued ICE candidates added',
          );

          /**
           * Do not force "connected" here.
           *
           * connectionState will become "connected"
           * when WebRTC actually establishes the connection.
           */
        } catch (error) {
          console.error(
            '[WebRTC] Error setting remote answer:',
            error,
          );

          get().endCall();
        }
      },
    );

    // ============================================================
    // ICE CANDIDATE
    // ============================================================

    socket.on(
      'ice-candidate',
      async ({
        candidate,
      }: {
        candidate: RTCIceCandidateInit;
      }) => {
        if (!candidate) {
          return;
        }

        /**
         * Peer connection does not exist yet.
         *
         * This can happen when an ICE candidate arrives
         * before the receiver clicks Accept.
         *
         * Keep the candidate.
         */
        if (!pc) {
          console.log(
            '[WebRTC] Queueing ICE candidate - no peer connection yet',
          );

          queuedCandidates.push(candidate);
          return;
        }

        /**
         * Peer exists but remote SDP has not been applied yet.
         */
        if (!pc.remoteDescription) {
          console.log(
            '[WebRTC] Queueing ICE candidate - no remote description yet',
          );

          queuedCandidates.push(candidate);
          return;
        }

        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(candidate),
          );

          console.log(
            '[WebRTC] ICE candidate added',
          );
        } catch (error) {
          console.error(
            '[WebRTC] Error adding ICE candidate:',
            error,
          );
        }
      },
    );

    // ============================================================
    // CALL REJECTED
    // ============================================================

    socket.on(
      'call-rejected',
      ({ reason }: { reason?: string } = {}) => {
        console.log(
          '[WebRTC] Call rejected:',
          reason,
        );

        if (isEndingCall) {
          return;
        }

        setIsEndingCall(true);

        try {
          const state = get();

          stopStream(state.localStream);
          stopStream(state.remoteStream);

          cleanupPeerConnection();

          queuedCandidates.length = 0;

          set(idleState());
        } finally {
          setIsEndingCall(false);
        }
      },
    );

    // ============================================================
    // CALL ENDED
    // ============================================================

    socket.on('call-ended', () => {
      console.log('[WebRTC] Other user ended the call');

      if (isEndingCall) {
        return;
      }

      setIsEndingCall(true);

      try {
        const state = get();

        stopStream(state.localStream);
        stopStream(state.remoteStream);

        cleanupPeerConnection();

        queuedCandidates.length = 0;

        set(idleState());
      } finally {
        setIsEndingCall(false);
      }
    });
  };

/**
 * Creates a new RTCPeerConnection.
 *
 * Responsibilities:
 * - Add local audio/video tracks
 * - Send ICE candidates
 * - Receive remote audio/video tracks
 * - Monitor connection state
 */
export const createPeerConnection = (
  targetUserId: string,
  localStream: MediaStream,
  set: SetFn,
  get: GetFn,
  socket: Socket,
) => {
  /**
   * Clean up an old peer connection.
   *
   * IMPORTANT:
   * We intentionally DO NOT clear queuedCandidates here.
   *
   * Candidates may have arrived before this peer connection
   * was created, especially on the receiver side.
   */
  cleanupPeerConnection(false);

  const newPc = new RTCPeerConnection(configuration);

  setPc(newPc);

  // ============================================================
  // ADD LOCAL TRACKS
  // ============================================================

  localStream.getTracks().forEach((track) => {
    console.log(
      '[WebRTC] Adding local track:',
      {
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
      },
    );

    newPc.addTrack(track, localStream);
  });

  console.log(
    '[WebRTC] Local tracks:',
    localStream.getTracks().map((track) => ({
      kind: track.kind,
      id: track.id,
      enabled: track.enabled,
      readyState: track.readyState,
    })),
  );

  // ============================================================
  // SEND ICE CANDIDATES
  // ============================================================

  newPc.onicecandidate = (event) => {
    if (pc !== newPc) {
      return;
    }

    if (!event.candidate) {
      return;
    }

    console.log(
      '[WebRTC] Sending ICE candidate:',
      event.candidate.candidate,
    );

    socket.emit('ice-candidate', {
      to: targetUserId,
      candidate: event.candidate.toJSON(),
    });
  };

  // ============================================================
  // RECEIVE REMOTE TRACKS
  // ============================================================

  const remoteStream = new MediaStream();

  newPc.ontrack = (event) => {
    if (pc !== newPc) {
      return;
    }

    const track = event.track;

    console.log(
      '[WebRTC] Remote track received:',
      {
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
      },
    );

    /**
     * Add the remote track only once.
     */
    if (!remoteStream.getTrackById(track.id)) {
      remoteStream.addTrack(track);
    }

    console.log(
      '[WebRTC] Remote stream tracks:',
      remoteStream.getTracks().map((remoteTrack) => ({
        kind: remoteTrack.kind,
        id: remoteTrack.id,
        enabled: remoteTrack.enabled,
        readyState: remoteTrack.readyState,
      })),
    );

    /**
     * Create a new MediaStream reference so Zustand
     * definitely detects the state update.
     */
    set({
      remoteStream: new MediaStream(
        remoteStream.getTracks(),
      ),
    });
  };

  // ============================================================
  // CONNECTION STATE
  // ============================================================

  newPc.onconnectionstatechange = () => {
    if (pc !== newPc) {
      return;
    }

    const state = newPc.connectionState;

    console.log(
      '[WebRTC] Connection state:',
      state,
    );

    if (state === 'connected') {
      console.log(
        '[WebRTC] WebRTC connection established',
      );

      set({
        callState: 'connected',
      });

      return;
    }

    if (state === 'failed') {
      console.error(
        '[WebRTC] WebRTC connection failed',
      );

      get().endCall();
      return;
    }

    if (state === 'closed') {
      get().endCall();
      return;
    }

    /**
     * Do not immediately terminate on "disconnected".
     *
     * Mobile networks can temporarily disconnect ICE.
     * Give it a few seconds to recover.
     */
    if (state === 'disconnected') {
      console.warn(
        '[WebRTC] Connection temporarily disconnected',
      );

      setTimeout(() => {
        if (pc !== newPc) {
          return;
        }

        if (newPc.connectionState === 'disconnected') {
          console.error(
            '[WebRTC] Connection remained disconnected',
          );

          get().endCall();
        }
      }, 5000);
    }
  };

  // ============================================================
  // ICE CONNECTION STATE
  // ============================================================

  newPc.oniceconnectionstatechange = () => {
    if (pc !== newPc) {
      return;
    }

    console.log(
      '[WebRTC] ICE connection state:',
      newPc.iceConnectionState,
    );

    if (newPc.iceConnectionState === 'failed') {
      console.error(
        '[WebRTC] ICE connection failed',
      );

      get().endCall();
    }
  };

  // ============================================================
  // SIGNALING STATE
  // ============================================================

  newPc.onsignalingstatechange = () => {
    if (pc !== newPc) {
      return;
    }

    console.log(
      '[WebRTC] Signaling state:',
      newPc.signalingState,
    );
  };

  return {
    newPc,
    remoteStream,
  };
};
