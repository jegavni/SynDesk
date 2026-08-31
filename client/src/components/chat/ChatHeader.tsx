import type { SidebarItem, SidebarUser } from '../../types';
import UserAvatar from '../shared/UserAvatar';

interface ChatHeaderProps {
  isMobile: boolean;
  selectedUser: SidebarItem;
  onlineUsers: string[];
  onBack: () => void;
  onInitiateCall: (user: SidebarUser, type: 'voice' | 'video') => void;
}

const renderLastSeen = (user: SidebarItem, onlineUsers: string[]) => {
  // TypeScript knows that user is SidebarGroup here
  // because isGroup is the discriminating property.
  if (user.isGroup) {
    return `${user.members.length} members`;
  }

  if (onlineUsers.includes(user._id)) {
    return 'Online';
  }

  if (user.lastSeenPrivacy === 'nobody') {
    return 'Offline';
  }

  if (user.lastSeen) {
    return `Last seen ${new Date(user.lastSeen).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short',
    })}`;
  }

  return 'Offline';
};

const ChatHeader = ({
  isMobile,
  selectedUser,
  onlineUsers,
  onBack,
  onInitiateCall,
}: ChatHeaderProps) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--surface-color)',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.5rem' : '1rem',
    }}
  >
    {isMobile && (
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          padding: '0.4rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'auto',
          marginRight: '0.25rem',
        }}
        title="Back to Chats"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
    )}

    <UserAvatar user={selectedUser} size={40} />

    <div style={{ flex: 1 }}>
      <h3 style={{ fontWeight: 'bold' }}>
        {selectedUser.username}
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: selectedUser.isGroup
              ? 'var(--text-secondary)'
              : onlineUsers.includes(selectedUser._id)
                ? 'var(--success-color)'
                : 'var(--text-secondary)',
          }}
        >
          {renderLastSeen(selectedUser, onlineUsers)}
        </span>

        {/* Bio - only for individual users */}
        {!selectedUser.isGroup && (
          <>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              |
            </span>

            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              title={selectedUser.bio}
            >
              {selectedUser.bio || 'Hey there! I am using SynDesk.'}
            </span>
          </>
        )}
      </div>
    </div>

    {/* Call buttons - only for individual users */}
    {!selectedUser.isGroup && (
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
        }}
      >
        <button
          onClick={() => onInitiateCall(selectedUser, 'voice')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Voice Call"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 1 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>

        <button
          onClick={() => onInitiateCall(selectedUser, 'video')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Video Call"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 7l-7 5 7 5V7z" />
            <rect
              x="1"
              y="5"
              width="15"
              height="14"
              rx="2"
              ry="2"
            />
          </svg>
        </button>
      </div>
    )}
  </div>
);

export default ChatHeader;