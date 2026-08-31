import type { SidebarItem } from '../../types';
import UserAvatar from '../shared/UserAvatar';

interface ChatListProps {
  users: SidebarItem[];
  selectedUser: SidebarItem | null;
  onlineUsers: string[];
  onSelectUser: (user: SidebarItem) => void;
}

const renderStatus = (user: SidebarItem, onlineUsers: string[]) => {
  if (user.isGroup) return 'Group Chat';
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

const ChatList = ({ users, selectedUser, onlineUsers, onSelectUser }: ChatListProps) => {
  if (users.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', padding: '1.25rem 1rem', fontSize: '0.875rem' }}>
        No contacts yet.
      </p>
    );
  }

  return (
    <>
      {users.map((user) => {
        const isActive = selectedUser?._id === user._id;
        const isOnline = !user.isGroup && onlineUsers.includes(user._id);
        return (
          <div
            key={user._id}
            onClick={() => onSelectUser(user)}
            className={`chat-item${isActive ? ' chat-item--active' : ''}`}
          >
            <UserAvatar user={user} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: '600',
                color: 'white',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.9rem',
              }}>
                {user.username}
              </div>
              <div style={{
                fontSize: '0.775rem',
                color: isActive
                  ? 'rgba(255,255,255,0.75)'
                  : isOnline
                    ? 'var(--success-color)'
                    : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '0.1rem',
              }}>
                {renderStatus(user, onlineUsers)}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ChatList;
