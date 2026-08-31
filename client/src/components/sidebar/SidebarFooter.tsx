import type { AuthUser } from '../../types';
import UserAvatar from '../shared/UserAvatar';

interface SidebarFooterProps {
  authUser: AuthUser | null;
  onLogout: () => void;
}

const SidebarFooter = ({ authUser, onLogout }: SidebarFooterProps) => (
  <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'rgba(0,0,0,0.1)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {authUser && <UserAvatar user={authUser} size={40} />}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{ fontWeight: '600', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {authUser?.username}
        </div>
        <div
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
          title={authUser?.bio}
        >
          {authUser?.bio || 'Hey there! I am using SynDesk.'}
        </div>
      </div>
    </div>
    <button
      onClick={onLogout}
      style={{ width: '100%', padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
    >
      Logout
    </button>
  </div>
);

export default SidebarFooter;
