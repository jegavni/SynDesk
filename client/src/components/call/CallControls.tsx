import type React from 'react';
import './call.css';

interface CallControlsProps {
  callState: string;
  callType: 'voice' | 'video' | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number; // seconds, only shown when connected
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const MicOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const MicOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const VideoOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const VideoOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10l-3.5-2.5"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const PhoneAcceptIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const PhoneEndIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(135deg)' }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const SpeakerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

interface BtnProps {
  onClick: () => void;
  label: string;
  title: string;
  variant: 'neutral' | 'active' | 'accept' | 'reject';
  children: React.ReactNode;
}

const CallBtn = ({ onClick, label, title, variant, children }: BtnProps) => (
  <div className="call-btn-wrap">
    <button
      className={`call-btn call-btn--${variant}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
    <span className="call-btn-label">{label}</span>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const CallControls = ({
  callState,
  callType,
  isMuted,
  isVideoOff,
  callDuration,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleVideo,
}: CallControlsProps) => (
  <div className="call-controls">
    {callState === 'incoming' ? (
      /* ── Incoming: Decline | Accept ── */
      <>
        <CallBtn onClick={rejectCall} label="Decline" title="Decline call" variant="reject">
          <PhoneEndIcon />
        </CallBtn>

        <CallBtn onClick={acceptCall} label="Accept" title="Accept call" variant="accept">
          <PhoneAcceptIcon />
        </CallBtn>
      </>
    ) : (
      /* ── Active / Calling: controls row ── */
      <>
        {/* Mute */}
        <CallBtn
          onClick={toggleMute}
          label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          variant={isMuted ? 'active' : 'neutral'}
        >
          {isMuted ? <MicOffIcon /> : <MicOnIcon />}
        </CallBtn>

        {/* Video toggle — only for video calls */}
        {callType === 'video' && (
          <CallBtn
            onClick={toggleVideo}
            label={isVideoOff ? 'Start Video' : 'Stop Video'}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
            variant={isVideoOff ? 'active' : 'neutral'}
          >
            {isVideoOff ? <VideoOffIcon /> : <VideoOnIcon />}
          </CallBtn>
        )}

        {/* Duration — only when connected */}
        {callState === 'connected' && (
          <div className="call-btn-wrap">
            <div className="call-duration">{formatDuration(callDuration)}</div>
            <span className="call-btn-label">Duration</span>
          </div>
        )}

        {/* Speaker (visual only — future feature) */}
        <CallBtn
          onClick={() => {}}
          label="Speaker"
          title="Speaker (coming soon)"
          variant="neutral"
        >
          <SpeakerIcon />
        </CallBtn>

        {/* End call */}
        <CallBtn onClick={endCall} label="End Call" title="End call" variant="reject">
          <PhoneEndIcon />
        </CallBtn>
      </>
    )}
  </div>
);

export default CallControls;
