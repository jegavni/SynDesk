import { useEffect, useRef, useState } from 'react';
import type { SidebarUser } from '../types';
import CallControls from './call/CallControls';
import CallVideoArea from './call/CallVideoArea';
import './call/call.css';

interface CallOverlayProps {
  isMobile: boolean;
  callState: 'calling' | 'incoming' | 'connected';
  callType: 'voice' | 'video' | null;
  targetUser: SidebarUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onlineUsers?: string[];
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const useDraggable = (initialX = 20, initialY = 20, isMobile: boolean) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMobile) return;
    if ((e.target as HTMLElement).closest('button')) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const maxX = Math.max(10, window.innerWidth - 140);
      const maxY = Math.max(10, window.innerHeight - 60);

      const newX = Math.max(10, Math.min(maxX, dragRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(maxY, dragRef.current.initialY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  return { position, setPosition, handlePointerDown, isDragging };
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
  onlineUsers = [],
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleVideo,
}: CallOverlayProps) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  const localVideoRef = useRef<HTMLVideoElement>(null!);

  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Initial position towards top-right
  const initialX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 380) : 20;
  const initialY = 20;

  const { position, handlePointerDown } = useDraggable(initialX, initialY, isMobile);

  // Timer tick for connected call duration
  useEffect(() => {
    if (callState !== 'connected') return;

    const intervalId = window.setInterval(() => {
      setCallDuration((seconds) => seconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      setCallDuration(0);
    };
  }, [callState]);

  const isIncoming = callState === 'incoming';
  const isCalling = callState === 'calling';
  const isConnected = callState === 'connected';

  const positionStyle: React.CSSProperties = isMobile
    ? {}
    : {
        left: `${position.x}px`,
        top: `${position.y}px`,
      };

  return (
    <div className="call-overlay">
      {isMinimized ? (
        /* ── Minimized Floating Badge View ── */
        <div
          className="call-card--minimized"
          style={positionStyle}
          onPointerDown={handlePointerDown}
        >
          {/* Avatar */}
          <div className="relative flex items-center justify-center pointer-events-none">
            {targetUser?.profilePic ? (
              <img
                src={targetUser.profilePic}
                alt={targetUser.username}
                className="h-9 w-9 rounded-full object-cover border border-indigo-400/50"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {targetUser?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-gray-900" />
            )}
          </div>

          {/* User & Status details */}
          <div className="flex flex-col min-w-0 pr-1 pointer-events-none">
            <span className="text-xs font-semibold text-white truncate max-w-[100px]">
              {targetUser?.username || 'Call'}
            </span>
            <span className="text-[10px] text-gray-300">
              {isIncoming && 'Incoming...'}
              {isCalling && 'Calling...'}
              {isConnected && (
                <span className="text-green-400 font-mono font-medium">
                  {formatDuration(callDuration)}
                </span>
              )}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            {isIncoming ? (
              <>
                <button
                  type="button"
                  onClick={rejectCall}
                  className="call-mini-btn call-mini-btn--reject"
                  title="Decline"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={acceptCall}
                  className="call-mini-btn call-mini-btn--accept"
                  title="Accept"
                >
                  ✓
                </button>
              </>
            ) : (
              <>
                {isConnected && (
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`call-mini-btn ${isMuted ? 'call-mini-btn--active' : ''}`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? '🔇' : '🎤'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={endCall}
                  className="call-mini-btn call-mini-btn--reject"
                  title="End Call"
                >
                  ✕
                </button>
              </>
            )}

            {/* Expand / Maximize button */}
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="call-mini-btn call-mini-btn--expand ml-0.5"
              title="Expand Call Window"
            >
              ⤢
            </button>
          </div>
        </div>
      ) : (
        /* ── Full Floating Call Card View ── */
        <div
          className={isMobile ? 'call-card--fullscreen' : 'call-card'}
          style={positionStyle}
        >
          {/* Header handle with minimize control */}
          <div className="call-header" onPointerDown={handlePointerDown}>
            <div className="flex items-center gap-2 pointer-events-none">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-300">
                {callType === 'video' ? 'Video Call' : 'Voice Call'} - {targetUser?.username || 'User'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="call-header-btn"
                  title="Minimize Call Window"
                >
                  −
                </button>
              )}
            </div>
          </div>

          {/* Call Content Area */}
          <CallVideoArea
            callType={callType}
            callState={callState}
            targetUser={targetUser}
            localStream={localStream}
            remoteStream={remoteStream}
            isVideoOff={isVideoOff}
            onlineUsers={onlineUsers}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
          />

          {/* Controls Bar */}
          <CallControls
            callState={callState}
            callType={callType}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            callDuration={callDuration}
            acceptCall={acceptCall}
            rejectCall={rejectCall}
            endCall={endCall}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
          />
        </div>
      )}
    </div>
  );
};

export default CallOverlay;