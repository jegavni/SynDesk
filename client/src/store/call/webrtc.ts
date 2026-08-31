// ── WebRTC Singletons & Configuration ────────────────────────────────────────

export const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export let pc: RTCPeerConnection | null = null;
export let queuedCandidates: RTCIceCandidateInit[] = [];
export let isEndingCall = false;

export const setPc = (value: RTCPeerConnection | null) => { pc = value; };
export const setIsEndingCall = (value: boolean) => { isEndingCall = value; };

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Clean up WebRTC resources.
 */
export const cleanupPeerConnection = () => {
  if (pc) {
    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.oniceconnectionstatechange = null;
    pc.close();
    pc = null;
  }
  queuedCandidates = [];
};

/**
 * Stop all tracks from a media stream.
 */
export const stopStream = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

/**
 * Add queued ICE candidates after the remote description has been set.
 */
export const addQueuedCandidates = async () => {
  if (!pc) return;
  for (const candidate of queuedCandidates) {
    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding queued ICE candidate:', error);
    }
  }
  queuedCandidates = [];
};

/** Shared idle state reset for store set() calls. */
export const idleState = () => ({
  callState: 'idle' as const,
  callType: null,
  targetUser: null,
  localStream: null,
  remoteStream: null,
  incomingSignal: null,
  isMuted: false,
  isVideoOff: false,
});
