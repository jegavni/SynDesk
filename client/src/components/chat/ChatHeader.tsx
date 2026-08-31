import type { SidebarItem, SidebarUser } from '../../types';
import UserAvatar from '../shared/UserAvatar';
import { useCallStore } from '../../store/useCallStore';

interface ChatHeaderProps {
  isMobile: boolean;
  selectedUser: SidebarItem;
  onlineUsers: string[];
  onBack: () => void;
  onInitiateCall: (user: SidebarUser, type: 'voice' | 'video') => void;
}

const renderStatus = (user: SidebarItem, onlineUsers: string[]) => {
  if (user.isGroup) return `${user.members.length} members`;
  if (onlineUsers.includes(user._id)) return 'Online';
  if (user.lastSeenPrivacy === 'nobody') return 'Offline';
  if (user.lastSeen) {
    return `Last seen ${new Date(user.lastSeen).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short',
    })}`;
  }
  return 'Offline';
};

const CallBtn = ({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.07)',
      color: disabled ? 'rgba(255,255,255,0.25)' : 'white',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      minHeight: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.2s',
      padding: 0,
    }}
  >
    {children}
  </button>
);

const ChatHeader = ({ isMobile, selectedUser, onlineUsers, onBack, onInitiateCall }: ChatHeaderProps) => {
  const callState = useCallStore((s) => s.callState);
  const isCallActive = callState !== 'idle';
  const isOnline = !selectedUser.isGroup && onlineUsers.includes(selectedUser._id);

  return (
    <div className="chat-header">
      {/* Back button — mobile only */}
      {isMobile && (
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '0.4rem',
            minHeight: '40px',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            borderRadius: '50%',
          }}
          title="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}

      <UserAvatar user={selectedUser} size={38} />

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontWeight: '700',
          fontSize: '0.95rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {selectedUser.username}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
          <span style={{
            fontSize: '0.775rem',
            color: isOnline ? 'var(--success-color)' : 'var(--text-secondary)',
          }}>
            {renderStatus(selectedUser, onlineUsers)}
          </span>
          {/* Bio — only on desktop and only for DMs */}
          {!isMobile && !selectedUser.isGroup && selectedUser.bio && (
            <>
              <span style={{ fontSize: '0.775rem', color: 'rgba(255,255,255,0.15)' }}>|</span>
              <span style={{
                fontSize: '0.775rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px',
              }} title={selectedUser.bio}>
                {selectedUser.bio}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Call buttons — only for DMs */}
      {!selectedUser.isGroup && (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <CallBtn
            onClick={() => onInitiateCall(selectedUser, 'voice')}
            disabled={isCallActive}
            title={isCallActive ? 'Already in a call' : 'Voice Call'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </CallBtn>
          <CallBtn
            onClick={() => onInitiateCall(selectedUser, 'video')}
            disabled={isCallActive}
            title={isCallActive ? 'Already in a call' : 'Video Call'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </CallBtn>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;