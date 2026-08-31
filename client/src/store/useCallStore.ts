
import { create } from 'zustand';
import { RTCSignal, SidebarUser } from '../types';

import {
  buildSetupSocketListeners,
} from './call/socketHandlers';

import {
  buildInitiateCall,
  buildAcceptCall,
  buildRejectCall,
  buildEndCall,
  buildToggleMute,
  buildToggleVideo,
} from './call/callActions';

export interface CallState {
  // --------------------------------------------------------------------------
  // CALL STATE
  // --------------------------------------------------------------------------

  callState:
    | 'idle'
    | 'calling'
    | 'incoming'
    | 'connected';

  callType:
    | 'voice'
    | 'video'
    | null;

  // User on the other side of the call
  targetUser:
    | SidebarUser
    | null;

  // --------------------------------------------------------------------------
  // MEDIA
  // --------------------------------------------------------------------------

  localStream:
    | MediaStream
    | null;

  remoteStream:
    | MediaStream
    | null;

  // --------------------------------------------------------------------------
  // CONTROLS
  // --------------------------------------------------------------------------

  isMuted: boolean;

  isVideoOff: boolean;

  // --------------------------------------------------------------------------
  // INCOMING CALL
  // --------------------------------------------------------------------------

  incomingSignal:
    | RTCSignal
    | null;

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  initiateCall: (
    targetUser: SidebarUser,
    type: 'voice' | 'video',
  ) => Promise<void>;

  acceptCall: () => Promise<void>;

  rejectCall: () => void;

  endCall: () => void;

  toggleMute: () => void;

  toggleVideo: () => void;

  setupSocketListeners: () => void;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useCallStore =
  create<CallState>((set, get) => ({
    // ------------------------------------------------------------------------
    // INITIAL STATE
    // ------------------------------------------------------------------------

    callState: 'idle',

    callType: null,

    targetUser: null,

    localStream: null,

    remoteStream: null,

    isMuted: false,

    isVideoOff: false,

    incomingSignal: null,

    // ------------------------------------------------------------------------
    // ACTIONS
    // ------------------------------------------------------------------------

    setupSocketListeners:
      buildSetupSocketListeners(
        set,
        get,
      ),

    initiateCall:
      buildInitiateCall(
        set,
        get,
      ),

    acceptCall:
      buildAcceptCall(
        set,
        get,
      ),

    rejectCall:
      buildRejectCall(
        set,
        get,
      ),

    endCall:
      buildEndCall(
        set,
        get,
      ),

    toggleMute:
      buildToggleMute(
        set,
        get,
      ),

    toggleVideo:
      buildToggleVideo(
        set,
        get,
      ),
  }));

