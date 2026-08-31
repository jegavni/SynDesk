import type React from 'react';
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
    if (callState === 'incoming') return callType === 'video' ? 'Incoming video call' : 'Incoming voice call';
    if (callState === 'calling')  return targetUser && onlineUsers.includes(targetUser._id) ? 'Ringing' : 'Calling';
    if (isConnected)              return null; // timer shown in controls
    return 'Connecting';
  };

  const showDots = callState === 'calling' || callState === 'connecting' || callState === 'incoming';

  // ── VIDEO CALL ─────────────────────────────────────────────────────────────
  if (callType === 'video') {
    return (
      <div className="call-video-area">
        {/* Remote stream (full area) */}
        {remoteStream && isConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="call-video-remote"
          />
        ) : (
          /* Waiting / incoming state inside video call */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <CallUserDisplay
              username={targetUser?.username}
              profilePic={targetUser?.profilePic}
              pulseVariant="indigo"
            />
            <span className="call-name">{targetUser?.username}</span>
            <span className="call-status">
              {statusLine()}
              {showDots && <StatusDots />}
            </span>
          </div>
        )}

        {/* Local PIP — bottom right */}
        {localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="call-video-local"
            style={{ display: isVideoOff ? 'none' : undefined }}
          />
        )}

        {/* Overlay name + status on top of remote video */}
        {remoteStream && isConnected && (
          <div style={{
            position: 'absolute', top: '1.25rem', left: '1.25rem',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            borderRadius: '0.75rem', padding: '0.4rem 0.9rem',
            color: '#fff', fontSize: '0.9rem', fontWeight: 600,
          }}>
            {targetUser?.username}
          </div>
        )}
      </div>
    );
  }

  // ── VOICE CALL ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '2.5rem 1rem 1rem',
    }}>
      <CallUserDisplay
        username={targetUser?.username}
        profilePic={targetUser?.profilePic}
        pulseVariant={isConnected ? 'green' : 'indigo'}
        showConnectedDot={isConnected}
      />

      <span className="call-name">{targetUser?.username}</span>

      {statusLine() && (
        <span className="call-status">
          {statusLine()}
          {showDots && <StatusDots />}
        </span>
      )}

      {isConnected && (
        <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600, marginTop: '0.25rem' }}>
          ● Connected
        </span>
      )}
    </div>
  );
};

export default CallVideoArea;
