import type { SidebarItem } from '../../types';
import UserAvatar from '../shared/UserAvatar';

interface ChatListProps {
  users: SidebarItem[];
  selectedUser: SidebarItem | null;
  onlineUsers: string[];
  onSelectUser: (user: SidebarItem) => void;
}

const renderLastSeen = (user: SidebarItem, onlineUsers: string[]) => {
  if (user.isGroup) return 'Group Chat';
  if (onlineUsers.includes(user._id)) return 'Online';
  if (user.lastSeenPrivacy === 'nobody') return 'Offline';
  if (user.lastSeen) {
    return `Last seen ${new Date(user.lastSeen).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`;
  }
  return 'Offline';
};

const ChatList = ({ users, selectedUser, onlineUsers, onSelectUser }: ChatListProps) => {
  if (users.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.9rem' }}>No contacts yet.</p>;
  }

  return (
    <>
      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => onSelectUser(user)}
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
            backgroundColor: selectedUser?._id === user._id ? 'var(--primary-color)' : 'transparent',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <UserAvatar user={user} size={40} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.username}
              </span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.8rem',
              color: user.isGroup
                ? 'var(--text-secondary)'
                : onlineUsers.includes(user._id) ? 'var(--success-color)' : 'var(--text-secondary)',
            }}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {renderLastSeen(user, onlineUsers)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ChatList;
