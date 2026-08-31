import type React from 'react';
import { useEffect } from 'react';
import type { SidebarUser } from '../../types';

import CallUserDisplay from './CallUserDisplay';
import './call.css';

interface CallVideoAreaProps {
  callType: 'voice' | 'video' | null;
  callState: string;
  targetUser: SidebarUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoOff: boolean;
  onlineUsers: string[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

// Animated ellipsis dots shown while waiting/ringing
const StatusDots = () => (
  <>
    <span className="call-status-dot" />
    <span className="call-status-dot" />
    <span className="call-status-dot" />
  </>
);

const CallVideoArea = ({
  callType,
  callState,
  targetUser,
  localStream,
  remoteStream,
  isVideoOff,
  onlineUsers,
  localVideoRef,
  remoteVideoRef,
}: CallVideoAreaProps) => {
  const isConnected = callState === 'connected';

  const statusLine = () => {
    if (callState === 'incoming') {
      return callType === 'video'
        ? 'Incoming video call'
        : 'Incoming voice call';
    }

    if (callState === 'calling') {
      return targetUser &&
        onlineUsers.includes(targetUser._id)
        ? 'Ringing'
        : 'Calling';
    }

    if (isConnected) {
      return null;
    }

    return 'Connecting';
  };

  const showDots =
    callState === 'calling' ||
    callState === 'connecting' ||
    callState === 'incoming';

  // ============================================================
  // ATTACH REMOTE STREAM
  // ============================================================

  useEffect(() => {
    const video = remoteVideoRef.current;

    if (!video) {
      console.log(
        '[CallVideoArea] Remote video element not mounted',
      );
      return;
    }

    if (!remoteStream) {
      console.log(
        '[CallVideoArea] No remote stream',
      );

      video.srcObject = null;
      return;
    }

    console.log(
      '[CallVideoArea] Attaching remote stream:',
      remoteStream.getTracks().map((track) => ({
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
      })),
    );

    video.srcObject = remoteStream;
    video.muted = false;
    video.autoplay = true;
    video.playsInline = true;

    const playRemoteVideo = async () => {
      try {
        await video.play();

        console.log(
          '[CallVideoArea] Remote video started playing',
        );
      } catch (error) {
        console.warn(
          '[CallVideoArea] Remote video play failed:',
          error,
        );
      }
    };

    playRemoteVideo();

    return () => {
      /**
       * Only clear the srcObject if this exact stream
       * is still attached.
       */
      if (video.srcObject === remoteStream) {
        video.srcObject = null;
      }
    };
  }, [remoteStream, remoteVideoRef]);

  // ============================================================
  // ATTACH LOCAL STREAM
  // ============================================================

  useEffect(() => {
    const video = localVideoRef.current;

    if (!video) {
      console.log(
        '[CallVideoArea] Local video element not mounted',
      );
      return;
    }

    if (!localStream) {
      console.log(
        '[CallVideoArea] No local stream',
      );

      video.srcObject = null;
      return;
    }

    console.log(
      '[CallVideoArea] Attaching local stream:',
      localStream.getTracks().map((track) => ({
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
      })),
    );

    video.srcObject = localStream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const playLocalVideo = async () => {
      try {
        await video.play();

        console.log(
          '[CallVideoArea] Local video started playing',
        );
      } catch (error) {
        console.warn(
          '[CallVideoArea] Local video play failed:',
          error,
        );
      }
    };

    playLocalVideo();

    return () => {
      if (video.srcObject === localStream) {
        video.srcObject = null;
      }
    };
  }, [localStream, localVideoRef]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="call-video-area" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* =========================================================
          PERSISTENT REMOTE VIDEO/AUDIO ELEMENT
          Must remain in DOM so WebRTC audio tracks play.
      ========================================================== */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={callType === 'video' && remoteStream ? "call-video-remote" : ""}
        style={
          callType === 'video' && remoteStream
            ? undefined
            : { display: 'none' }
        }
      />

      {/* =========================================================
          PERSISTENT LOCAL VIDEO PREVIEW ELEMENT
      ========================================================== */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={callType === 'video' && localStream && !isVideoOff ? "call-video-local" : ""}
        style={
          callType === 'video' && localStream && !isVideoOff
            ? undefined
            : { display: 'none' }
        }
      />

      {/* =========================================================
          UI DISPLAY: VOICE CALL OR CONNECTING VIDEO CALL
      ========================================================== */}
      {callType === 'voice' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '2.5rem 1rem 1rem',
            width: '100%',
            height: '100%',
          }}
        >
          <CallUserDisplay
            username={targetUser?.username}
            profilePic={targetUser?.profilePic}
            pulseVariant={isConnected ? 'green' : 'indigo'}
            showConnectedDot={isConnected}
          />

          <span className="call-name">
            {targetUser?.username}
          </span>

          {statusLine() && (
            <span className="call-status">
              {statusLine()}
              {showDots && <StatusDots />}
            </span>
          )}

          {isConnected && (
            <span
              style={{
                fontSize: '0.85rem',
                color: '#22c55e',
                fontWeight: 600,
                marginTop: '0.25rem',
              }}
            >
              ● Connected
            </span>
          )}
        </div>
      ) : (
        /* Video Call Display */
        <>
          {!remoteStream && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                width: '100%',
                height: '100%',
              }}
            >
              <CallUserDisplay
                username={targetUser?.username}
                profilePic={targetUser?.profilePic}
                pulseVariant="indigo"
              />

              <span className="call-name">
                {targetUser?.username}
              </span>

              <span className="call-status">
                {statusLine()}
                {showDots && <StatusDots />}
              </span>
            </div>
          )}

          {remoteStream && (
            <div
              style={{
                position: 'absolute',
                top: '1.25rem',
                left: '1.25rem',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(6px)',
                borderRadius: '0.75rem',
                padding: '0.4rem 0.9rem',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                zIndex: 10,
              }}
            >
              {targetUser?.username}
            </div>
          )}

          {!remoteStream && (
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span className="call-status">
                {statusLine()}
                {showDots && <StatusDots />}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallVideoArea;
