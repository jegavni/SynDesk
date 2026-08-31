
import { useChatStore } from '../useChatStore';
import { SidebarUser } from '../../types';
import { CallState } from '../useCallStore';
import type { StoreApi } from 'zustand/vanilla';

import {
  pc,
  isEndingCall,
  setIsEndingCall,
  cleanupPeerConnection,
  stopStream,
  addQueuedCandidates,
  idleState,
} from './webrtc';

import { createPeerConnection } from './socketHandlers';

type SetFn = StoreApi<CallState>['setState'];
type GetFn = StoreApi<CallState>['getState'];

/**
 * Prevents two initiateCall() operations from running at the same time.
 *
 * Zustand state updates are asynchronous, so checking only:
 *
 *     get().callState === 'idle'
 *
 * is not enough.
 */
let isInitiatingCall = false;

/**
 * --------------------------------------------------------------------------
 * INITIATE CALL
 * --------------------------------------------------------------------------
 *
 * Caller flow:
 *
 * getUserMedia()
 *      ↓
 * create RTCPeerConnection
 *      ↓
 * add local tracks
 *      ↓
 * create offer
 *      ↓
 * setLocalDescription()
 *      ↓
 * emit call-user
 *
 * The caller remains in "calling" state until the answer arrives and
 * WebRTC's connectionState becomes "connected".
 */
export const buildInitiateCall =
  (set: SetFn, get: GetFn) =>
  async (
    targetUser: SidebarUser,
    type: 'voice' | 'video',
  ): Promise<void> => {
    /*
     * Prevent duplicate calls caused by double-clicks or rapid UI events.
     */
    if (isInitiatingCall) {
      console.warn(
        '[WebRTC] Call initiation already in progress',
      );
      return;
    }

    /*
     * Do not start another call if this store is already handling
     * a call.
     */
    if (get().callState !== 'idle') {
      console.warn(
        '[WebRTC] Already handling a call',
      );
      return;
    }

    /*
     * Validate target.
     */
    if (!targetUser?._id) {
      console.error(
        '[WebRTC] Invalid target user',
      );
      return;
    }

    const socket =
      useChatStore.getState().socket;

    if (!socket) {
      console.error(
        '[WebRTC] Socket is not connected',
      );
      return;
    }

    isInitiatingCall = true;

    let stream: MediaStream | null = null;

    try {
      console.log(
        '[WebRTC] Starting',
        type,
        'call to',
        targetUser._id,
      );

      /*
       * Request microphone and optionally camera.
       */
      stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
            video: type === 'video',
          },
        );

      /*
       * Create a new RTCPeerConnection.
       */
      const { remoteStream } =
        createPeerConnection(
          targetUser._id,
          stream,
          set,
          get,
          socket,
        );

      /*
       * Peer connection must exist after createPeerConnection().
       */
      if (!pc) {
        throw new Error(
          'Peer connection was not created',
        );
      }

      /*
       * Create the SDP offer.
       */
      const offer =
        await pc.createOffer();

      /*
       * Set our local SDP.
       *
       * This also starts ICE gathering.
       */
      await pc.setLocalDescription(
        offer,
      );

      /*
       * Make sure the local description actually exists.
       */
      if (!pc.localDescription) {
        throw new Error(
          'Local description was not created',
        );
      }

      /*
       * Update Zustand state BEFORE notifying the other user.
       *
       * This is important because the remote user's incoming-call event
       * can arrive very quickly.
       */
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

      /*
       * Send the offer to the receiver.
       *
       * IMPORTANT:
       *
       * This event name must match the server:
       *
       * socket.on('call-user', ...)
       */
      socket.emit(
        'call-user',
        {
          to: targetUser._id,

          signal:
            pc.localDescription,

          type,
        },
      );

      console.log(
        '[WebRTC] Call offer sent',
      );
    } catch (error) {
      console.error(
        '[WebRTC] Failed to initiate call:',
        error,
      );

      const err = error as Error | undefined;
      const errName = err?.name || '';
      const errMsg =
        errName === 'NotAllowedError' || errName === 'PermissionDeniedError'
          ? 'Microphone/Camera permission was denied. Please allow device access in browser settings.'
          : errName === 'NotFoundError' || errName === 'DevicesNotFoundError'
          ? 'No microphone/camera device found.'
          : `Failed to start call: ${err?.message || String(error)}`;
      alert(errMsg);

      if (stream) {
        stopStream(stream);
      }

      cleanupPeerConnection();

      set(
        idleState(),
      );
    } finally {
      /*
       * Always release the synchronous lock.
       */
      isInitiatingCall = false;
    }
  };

/**
 * --------------------------------------------------------------------------
 * ACCEPT CALL
 * --------------------------------------------------------------------------
 *
 * Receiver flow:
 *
 * incoming-call
 *      ↓
 * user presses Accept
 *      ↓
 * getUserMedia()
 *      ↓
 * create RTCPeerConnection
 *      ↓
 * setRemoteDescription(offer)
 *      ↓
 * add queued ICE
 *      ↓
 * createAnswer()
 *      ↓
 * setLocalDescription(answer)
 *      ↓
 * emit call-answered
 *
 * The receiver also waits for WebRTC connectionState === "connected".
 */
export const buildAcceptCall =
  (set: SetFn, get: GetFn) =>
  async (): Promise<void> => {
    const state = get();

    const {
      targetUser,
      incomingSignal,
      callType,
    } = state;

    const socket =
      useChatStore.getState().socket;

    /*
     * Validate socket.
     */
    if (!socket) {
      console.error(
        '[WebRTC] Socket is not connected',
      );
      return;
    }

    /*
     * Validate caller.
     */
    if (!targetUser?._id) {
      console.error(
        '[WebRTC] No caller found',
      );
      return;
    }

    /*
     * Validate incoming SDP.
     */
    if (!incomingSignal) {
      console.error(
        '[WebRTC] No incoming WebRTC signal',
      );
      return;
    }

    /*
     * Validate call type.
     */
    if (!callType) {
      console.error(
        '[WebRTC] No call type found',
      );
      return;
    }

    /*
     * Only an incoming call should be accepted.
     */
    if (
      state.callState !== 'incoming'
    ) {
      console.warn(
        '[WebRTC] No incoming call to accept',
      );
      return;
    }

    let stream: MediaStream | null =
      null;

    try {
      console.log(
        '[WebRTC] Accepting',
        callType,
        'call from',
        targetUser._id,
      );

      /*
       * Request the media required by the call.
       *
       * Do NOT silently convert a video call to audio.
       *
       * The caller requested video, so the receiver should either grant
       * camera access or the accept operation should fail.
       */
      stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,

            video:
              callType === 'video',
          },
        );

      /*
       * Create the receiver peer connection.
       */
      const {
        remoteStream,
      } = createPeerConnection(
        targetUser._id,
        stream,
        set,
        get,
        socket,
      );

      if (!pc) {
        throw new Error(
          'Peer connection was not created',
        );
      }

      /*
       * Validate the incoming offer.
       *
       * RTCSessionDescriptionInit.type must be present.
       */
      if (
        !incomingSignal.type ||
        !incomingSignal.sdp
      ) {
        throw new Error(
          'Invalid incoming WebRTC offer',
        );
      }

      /*
       * Apply the caller's offer FIRST.
       */
      await pc.setRemoteDescription(
        {
          type:
            incomingSignal.type,
          sdp:
            incomingSignal.sdp,
        },
      );

      console.log(
        '[WebRTC] Remote offer applied',
      );

      /*
       * ICE candidates may have arrived before the offer.
       *
       * They can now safely be added.
       */
      await addQueuedCandidates();

      /*
       * Create SDP answer.
       */
      const answer =
        await pc.createAnswer();

      /*
       * Set our local answer.
       */
      await pc.setLocalDescription(
        answer,
      );

      if (!pc.localDescription) {
        throw new Error(
          'Local answer was not created',
        );
      }

      /*
       * IMPORTANT:
       *
       * Do NOT set:
       *
       *     callState: 'connected'
       *
       * here.
       *
       * The call is connected only after WebRTC's connectionState
       * becomes "connected".
       */
      set({
        callState: 'calling',

        localStream: stream,

        remoteStream,

        incomingSignal: null,

        isMuted: false,

        isVideoOff: false,
      });

      /*
       * Send the answer to the caller.
       * Server listens on "answer-call" and relays "call-answered" to the caller.
       */
      socket.emit(
        'answer-call',
        {
          to: targetUser._id,

          signal:
            pc.localDescription,
        },
      );

      console.log(
        '[WebRTC] Call answer sent',
      );
    } catch (error) {
      console.error(
        '[WebRTC] Failed to accept call:',
        error,
      );

      const err = error as Error | undefined;
      const errName = err?.name || '';
      const errMsg =
        errName === 'NotAllowedError' || errName === 'PermissionDeniedError'
          ? 'Microphone/Camera permission was denied. Please allow device access in browser settings.'
          : errName === 'NotFoundError' || errName === 'DevicesNotFoundError'
          ? 'No microphone/camera device found.'
          : `Failed to accept call: ${err?.message || String(error)}`;
      alert(errMsg);

      if (stream) {
        stopStream(stream);
      }

      cleanupPeerConnection();

      set(
        idleState(),
      );
    }
  };

/**
 * --------------------------------------------------------------------------
 * REJECT CALL
 * --------------------------------------------------------------------------
 */
export const buildRejectCall =
  (set: SetFn, get: GetFn) =>
  (): void => {
    const {
      targetUser,
      localStream,
      remoteStream,
    } = get();

    const socket =
      useChatStore.getState().socket;

    if (
      socket &&
      targetUser?._id
    ) {
      console.log(
        '[WebRTC] Rejecting call from',
        targetUser._id,
      );

      socket.emit(
        'reject-call',
        {
          to: targetUser._id,

          reason: 'rejected',
        },
      );
    }

    /*
     * Stop local media.
     */
    stopStream(
      localStream,
    );

    /*
     * Stop remote media if present.
     */
    stopStream(
      remoteStream,
    );

    /*
     * Destroy peer connection.
     */
    cleanupPeerConnection();

    /*
     * Remove any stale ICE candidates.
     */
    // queuedCandidates are already cleared by cleanupPeerConnection()
    // in the normal implementation.

    /*
     * Reset call state.
     */
    set(
      idleState(),
    );
  };

/**
 * --------------------------------------------------------------------------
 * END CALL
 * --------------------------------------------------------------------------
 *
 * Used when the local user hangs up.
 */
export const buildEndCall =
  (set: SetFn, get: GetFn) =>
  (): void => {
    /*
     * Prevent cleanup loops caused by:
     *
     * local endCall()
     *       ↓
     * socket call-ended
     *       ↓
     * remote handler
     */
    if (isEndingCall) {
      return;
    }

    setIsEndingCall(true);

    try {
      const {
        targetUser,
        localStream,
        remoteStream,
        callState,
      } = get();

      const socket =
        useChatStore.getState().socket;

      /*
       * Tell the other user about the call ending.
       */
      if (
        socket &&
        targetUser?._id
      ) {
        if (
          callState === 'calling' ||
          callState === 'connected'
        ) {
          socket.emit(
            'end-call',
            {
              to: targetUser._id,
            },
          );
        } else if (
          callState === 'incoming'
        ) {
          socket.emit(
            'reject-call',
            {
              to: targetUser._id,
              reason: 'cancelled',
            },
          );
        }
      }

      /*
       * Stop local tracks.
       */
      stopStream(
        localStream,
      );

      /*
       * Stop remote tracks.
       */
      stopStream(
        remoteStream,
      );

      /*
       * Destroy peer connection.
       */
      cleanupPeerConnection();

      /*
       * Reset Zustand state.
       */
      set(
        idleState(),
      );
    } finally {
      setIsEndingCall(false);
    }
  };

/**
 * --------------------------------------------------------------------------
 * TOGGLE MUTE
 * --------------------------------------------------------------------------
 */
export const buildToggleMute =
  (set: SetFn, get: GetFn) =>
  (): void => {
    const {
      localStream,
      isMuted,
    } = get();

    if (!localStream) {
      return;
    }

    const audioTracks =
      localStream.getAudioTracks();

    if (
      audioTracks.length === 0
    ) {
      return;
    }

    /*
     * If currently muted, enable audio.
     *
     * If currently unmuted, disable audio.
     */
    const nextMuted =
      !isMuted;

    audioTracks.forEach(
      (track) => {
        track.enabled =
          !nextMuted;
      },
    );

    set({
      isMuted:
        nextMuted,
    });
  };

/**
 * --------------------------------------------------------------------------
 * TOGGLE VIDEO
 * --------------------------------------------------------------------------
 */
export const buildToggleVideo =
  (set: SetFn, get: GetFn) =>
  (): void => {
    const {
      localStream,
      isVideoOff,
    } = get();

    if (!localStream) {
      return;
    }

    const videoTracks =
      localStream.getVideoTracks();

    if (
      videoTracks.length === 0
    ) {
      return;
    }

    /*
     * If video is currently off, enable it.
     *
     * If video is currently on, disable it.
     */
    const nextVideoOff =
      !isVideoOff;

    videoTracks.forEach(
      (track) => {
        track.enabled =
          !nextVideoOff;
      },
    );

    set({
      isVideoOff:
        nextVideoOff,
    });
  };
