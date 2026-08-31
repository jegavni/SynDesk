import type { SidebarItem } from '../../types';

interface UserAvatarProps {
  user: SidebarItem | { username: string; profilePic?: string; isGroup?: false };
  size?: number;
}

const UserAvatar = ({ user, size = 40 }: UserAvatarProps) => {
  const s = `${size}px`;
  const base: React.CSSProperties = {
    width: s, height: s, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  if ('isGroup' in user && user.isGroup) {
    return (
      <div style={{ ...base, backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.5} height={size * 0.5}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    );
  }

  if (user.profilePic) {
    return (
      <img
        src={user.profilePic}
        alt={user.username}
        style={{ ...base, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div style={{ ...base, backgroundColor: 'var(--border-color)', fontWeight: 'bold', color: 'white' }}>
      {user.username?.charAt(0).toUpperCase()}
    </div>
  );
};

export default UserAvatar;
