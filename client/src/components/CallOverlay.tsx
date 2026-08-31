import { useEffect, useRef, useState } from 'react';
import type { SidebarUser } from '../types';

interface CallOverlayProps {
  isMobile: boolean;
  callState: 'calling' | 'incoming' | 'connected';
  callType: 'voice' | 'video' | null;
  targetUser: SidebarUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};

const CallOverlay = ({
  isMobile,
  callState,
  callType,
  targetUser,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleVideo,
}: CallOverlayProps) => {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [callDuration, setCallDuration] = useState(0);

  /*
   * Start the call timer when the call becomes connected.
   *
   * The component is remounted by Home.tsx when callState changes
   * because it uses key={callState}. This means the timer naturally
   * starts from 0 for every new call.
   */
  useEffect(() => {
    if (callState !== 'connected') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCallDuration((seconds) => seconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [callState]);

  /*
   * Attach the remote stream to the remote video element.
   */
  useEffect(() => {
    if (!remoteVideoRef.current) {
      return;
    }

    remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  /*
   * Attach the local stream to the local video element.
   */
  useEffect(() => {
    if (!localVideoRef.current) {
      return;
    }

    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  const isIncoming = callState === 'incoming';
  const isCalling = callState === 'calling';
  const isConnected = callState === 'connected';
  const isVideoCall = callType === 'video';

  const userInitial =
    targetUser?.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ${
          isMobile
            ? 'h-full'
            : 'h-full max-h-[800px] max-w-4xl'
        }`}
      >
        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-3">
            {targetUser?.profilePic ? (
              <img
                src={targetUser.profilePic}
                alt={targetUser.username}
                className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600 text-lg font-semibold text-white sm:h-12 sm:w-12">
                {userInitial}
              </div>
            )}

            <div>
              <h2 className="font-semibold text-white">
                {targetUser?.username || 'Unknown User'}
              </h2>

              <p className="text-sm text-gray-300">
                {isIncoming && 'Incoming call...'}
                {isCalling && 'Calling...'}
                {isConnected && formatDuration(callDuration)}
              </p>
            </div>
          </div>

          {isConnected && (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
              Connected
            </span>
          )}
        </div>

        {/* Main Call Area */}
        <div className="relative flex flex-1 items-center justify-center bg-gray-950">
          {isVideoCall ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Remote User Placeholder */}
              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
                  {targetUser?.profilePic ? (
                    <img
                      src={targetUser.profilePic}
                      alt={targetUser.username}
                      className={`h-24 w-24 rounded-full object-cover ${
                        isConnected ? 'ring-4 ring-green-500' : ''
                      }`}
                    />
                  ) : (
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-full bg-gray-700 text-3xl font-semibold text-white ${
                        isConnected ? 'ring-4 ring-green-500' : ''
                      }`}
                    >
                      {userInitial}
                    </div>
                  )}

                  <p className="mt-4 text-gray-300">
                    {isIncoming && 'Incoming video call'}
                    {isCalling && 'Calling...'}
                    {isConnected && 'Waiting for video...'}
                  </p>
                </div>
              )}

              {/* Local Video */}
              {localStream && (
                <div className="absolute bottom-24 right-4 z-10 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/30 bg-black shadow-lg sm:bottom-28 sm:right-5 sm:h-40 sm:w-32">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <span className="text-xs text-white">
                        Camera off
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Voice Call */
            <div className="flex flex-col items-center justify-center px-4 text-center">
              {targetUser?.profilePic ? (
                <img
                  src={targetUser.profilePic}
                  alt={targetUser.username}
                  className={`h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32 ${
                    isConnected ? 'ring-4 ring-green-500' : ''
                  }`}
                />
              ) : (
                <div
                  className={`flex h-28 w-28 items-center justify-center rounded-full bg-gray-700 text-4xl font-semibold text-white sm:h-32 sm:w-32 ${
                    isConnected ? 'ring-4 ring-green-500' : ''
                  }`}
                >
                  {userInitial}
                </div>
              )}

              <h2 className="mt-6 text-xl font-semibold text-white sm:text-2xl">
                {targetUser?.username || 'Unknown User'}
              </h2>

              <p className="mt-2 text-gray-400">
                {isIncoming && 'Incoming voice call'}
                {isCalling && 'Calling...'}
                {isConnected && formatDuration(callDuration)}
              </p>

              {isConnected && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                  <span className="text-sm text-green-400">
                    Call connected
                  </span>
                </div>
              )}

              {isCalling && (
                <p className="mt-3 text-sm text-gray-500">
                  Calling {targetUser?.username || 'user'}...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Incoming Call Controls */}
        {isIncoming && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-8 bg-gradient-to-t from-black/90 to-transparent p-8">
            <button
              type="button"
              onClick={rejectCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-xl text-white transition hover:bg-red-700"
              aria-label="Reject call"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={acceptCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-xl text-white transition hover:bg-green-700"
              aria-label="Accept call"
            >
              ✓
            </button>
          </div>
        )}

        {/* Calling Controls */}
        {isCalling && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center bg-gradient-to-t from-black/90 to-transparent p-8">
            <button
              type="button"
              onClick={endCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-xl text-white transition hover:bg-red-700"
              aria-label="Cancel call"
            >
              ✕
            </button>
          </div>
        )}

        {/* Connected Controls */}
        {isConnected && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 to-transparent p-6 sm:p-8">
            {/* Mute */}
            <button
              type="button"
              onClick={toggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition ${
                isMuted
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            {/* Video Toggle */}
            {isVideoCall && (
              <button
                type="button"
                onClick={toggleVideo}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition ${
                  isVideoOff
                    ? 'bg-white text-black'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                aria-label={
                  isVideoOff
                    ? 'Turn video on'
                    : 'Turn video off'
                }
              >
                {isVideoOff ? '📷' : '🎥'}
              </button>
            )}

            {/* End Call */}
            <button
              type="button"
              onClick={endCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-xl text-white transition hover:bg-red-700"
              aria-label="End call"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;